// crabtalk/bezel stateful database: runs a test's Mermaid database calls on the model
// bezel-mermaid's own public `mermaid::parse` returns, through the model types' own public
// methods. See ../../bridges.ts for the protocol.
//
// Each request replays the database's whole history: where it starts, `{"parse": source}`
// (the diagram the test parsed) or `{"new": header}` (a fresh database, see `fresh`), then
// every `{"call": member, "args": [...]}` the test made since. Replaying is deterministic, so the
// model is the one a long-lived database would hold. Only the last operation's outcome is
// reported; an earlier one already was, when the test made it.
//
// A binding passes the test's arguments to the one public method; it converts nothing it
// cannot convert exactly. A native enum argument is the variant whose own public name (or
// serialization) is the value the test passed, a struct argument is built from the test's
// object only when serializing it gives that object back, and every other argument shape
// is a Trident gap. Nothing is invented: a missing value Bezel's method needs is a gap.
use mermaid::diagrams::{
    Model, agentflow::types::DiagnosticId, architecture::db::{ArchGroup, ArchLayoutHint, ArchNode, ArchNodeKind}, architecture::parser::Alignment,
    common::outline::{NodeType as OutlineNodeType, OutlineDb}, gantt::dates::Weekday,
    quadrant::db::{PointStyle, QuadrantText, TextKind}, requirement::types::{Relationship, RequirementType, Risk, VerifyMethod},
    state::types::StateKind,
};
use mermaid::{Error, Options};
use serde::Serialize;
use serde_json::{Map, Value, json};

use crate::protocol::{Reply, family_matches};

pub enum Fail {
    /// Trident cannot express this call through Bezel's public method.
    Gap(String),
    /// Bezel's own method returned its error.
    Native(Error),
}
type Out = Result<Option<Value>, Fail>;
type Method<D> = (&'static str, fn(&mut D, &Args) -> Out);

pub struct Args<'a>(&'a [Value], &'a str);

fn gap<T>(message: String) -> Result<T, Fail> {
    Err(Fail::Gap(message))
}

impl<'a> Args<'a> {
    fn at(&self, i: usize) -> &'a Value {
        self.0.get(i).unwrap_or(&Value::Null)
    }
    fn wrong<T>(&self, i: usize, what: &str) -> Result<T, Fail> {
        gap(format!("bezel {}: argument {} is {}, not {what}", self.1, i + 1, self.at(i)))
    }
    fn str(&self, i: usize) -> Result<&'a str, Fail> {
        self.at(i).as_str().map_or_else(|| self.wrong(i, "a string"), Ok)
    }
    fn opt_str(&self, i: usize) -> Result<Option<&'a str>, Fail> {
        if self.at(i).is_null() { Ok(None) } else { self.str(i).map(Some) }
    }
    fn index(&self, i: usize) -> Result<usize, Fail> {
        self.at(i).as_u64().map_or_else(|| self.wrong(i, "a non-negative integer"), |n| Ok(n as usize))
    }
    fn strs(&self, i: usize) -> Result<Vec<&'a str>, Fail> {
        match self.at(i).as_array() {
            Some(items) if items.iter().all(Value::is_string) => Ok(items.iter().filter_map(Value::as_str).collect()),
            _ => self.wrong(i, "a list of strings"),
        }
    }
    fn strings(&self, i: usize) -> Result<Vec<String>, Fail> {
        self.strs(i).map(|items| items.into_iter().map(String::from).collect())
    }
    /// Arguments from `i` on are parameters of Bezel's method this binding does not
    /// convert, so the test must not pass them.
    fn none_from(&self, i: usize) -> Result<(), Fail> {
        match self.0.iter().skip(i).position(|value| !value.is_null()) {
            None => Ok(()),
            Some(at) => self.wrong(i + at, "absent (this binding passes no value for it)"),
        }
    }
    /// The variant whose own name is the argument.
    fn named<T: Copy>(&self, i: usize, all: &[T], name: fn(T) -> &'static str) -> Result<T, Fail> {
        let text = self.str(i)?;
        all.iter().copied().find(|variant| name(*variant) == text).map_or_else(|| self.wrong(i, "a name the native type has"), Ok)
    }
    /// The variant whose own serialization is the argument.
    fn serialized<T: Copy + Serialize>(&self, i: usize, all: &[T]) -> Result<T, Fail> {
        serialized(self.at(i), all).map_or_else(|| self.wrong(i, "a value the native type serializes as"), Ok)
    }
    /// A struct built from the argument object, kept only when serializing it gives
    /// every key of that object back, unchanged, and no other key.
    fn record<T: Serialize>(&self, i: usize, build: impl FnOnce(&Map<String, Value>) -> Option<T>) -> Result<T, Fail> {
        let Some(object) = self.at(i).as_object() else { return self.wrong(i, "an object") };
        match build(object) {
            Some(built) if serde_json::to_value(&built).ok().as_ref() == Some(&Value::Object(object.clone())) => Ok(built),
            _ => self.wrong(i, "an object the native type serializes back to"),
        }
    }
}

fn serialized<T: Copy + Serialize>(value: &Value, all: &[T]) -> Option<T> {
    all.iter().copied().find(|variant| serde_json::to_value(variant).ok().as_ref() == Some(value))
}
fn field<'v>(object: &'v Map<String, Value>, key: &str) -> Option<&'v Value> {
    object.get(key).filter(|value| !value.is_null())
}
fn text(object: &Map<String, Value>, key: &str) -> Option<String> {
    field(object, key).and_then(Value::as_str).map(String::from)
}

fn done() -> Out {
    Ok(None)
}
fn native(result: Result<(), Error>) -> Out {
    result.map(|()| None).map_err(Fail::Native)
}
fn returns<T: Serialize>(value: T) -> Out {
    serde_json::to_value(value).map(Some).map_err(|error| Fail::Gap(format!("bezel result did not serialize: {error}")))
}

/// Every variant of an enum an argument names. The match fails the build if the enum
/// gains a variant this list lacks.
macro_rules! every {
    ($ty:ident: $($variant:ident),* $(,)?) => {{
        #[allow(dead_code)]
        const fn exhaustive(value: $ty) {
            match value { $($ty::$variant => {})* }
        }
        [$($ty::$variant),*]
    }};
}
const REQUIREMENT_TYPES: [RequirementType; 6] = every!(RequirementType: Requirement, Functional, Interface, Performance, Physical, DesignConstraint);
const RELATIONSHIPS: [Relationship; 7] = every!(Relationship: Contains, Copies, Derives, Satisfies, Verifies, Refines, Traces);
const RISKS: [Risk; 3] = every!(Risk: Low, Medium, High);
const VERIFY_METHODS: [VerifyMethod; 4] = every!(VerifyMethod: Analysis, Demonstration, Inspection, Test);
const STATE_KINDS: [StateKind; 5] = every!(StateKind: Default, Fork, Join, Choice, Divider);
const OUTLINE_NODE_TYPES: [OutlineNodeType; 7] = every!(OutlineNodeType: Default, RoundedRect, Rect, Circle, Cloud, Bang, Hexagon);
const DIAGNOSTIC_IDS: [DiagnosticId; 12] = every!(DiagnosticId:
    ShapeUnsupported, ShapeRemoved, EdgeOperatorUnsupported, ReferenceEdgeLabelRejected, ConnectorRefUnresolved, ConnectorRefNotAConnector,
    MetadataKeyMisapplied, DuplicateIdNode, ReservedSyntheticId, ContainmentViolation, EdgeSemanticContradiction, FlowNoInput,
);
const ARCH_NODE_KINDS: [ArchNodeKind; 2] = every!(ArchNodeKind: Service, Junction);
const ALIGNMENTS: [Alignment; 2] = every!(Alignment: Row, Column);
const TEXT_KINDS: [TextKind; 2] = every!(TextKind: Text, Markdown);

use mermaid::diagrams::{
    agentflow::AgentflowDb, architecture::ArchitectureModel, class::ClassModel, flowchart::FlowDb, gantt::GanttDb, journey::JourneyModel,
    mindmap::MindmapModel, quadrant::QuadrantModel, railroad::db::RailroadDb, requirement::RequirementModel, state::StateModel,
    treeview::TreeViewModel,
};

static GANTT: &[Method<GanttDb>] = &[
    ("setDateFormat", |db, a| { db.set_date_format(a.str(0)?); done() }),
    ("enableInclusiveEndDates", |db, a| { a.none_from(0)?; db.enable_inclusive_end_dates(); done() }),
    ("setAxisFormat", |db, a| { db.set_axis_format(a.str(0)?); done() }),
    ("setTickInterval", |db, a| { db.set_tick_interval(a.str(0)?); done() }),
    ("setTodayMarker", |db, a| { db.set_today_marker(a.str(0)?); done() }),
    ("setIncludes", |db, a| { db.set_includes(a.str(0)?); done() }),
    ("setExcludes", |db, a| { db.set_excludes(a.str(0)?); done() }),
    ("setWeekday", |db, a| {
        let day = Weekday::from_name(a.str(0)?);
        match day { Some(day) => { db.set_weekday(day); done() } None => a.wrong(0, "a day gantt::dates::Weekday::from_name names") }
    }),
    ("addSection", |db, a| { db.add_section(a.str(0)?); done() }),
    ("addTask", |db, a| native(db.add_task(a.str(0)?, a.str(1)?))),
    ("setLink", |db, a| { db.set_link(a.str(0)?, a.str(1)?); done() }),
    // Bezel records a click callback without running it, so it takes no function name or arguments.
    ("setClickEvent", |db, a| { db.set_click_event(a.str(0)?); done() }),
    ("setClass", |db, a| { db.set_class(a.str(0)?, a.str(1)?); done() }),
];
static JOURNEY: &[Method<JourneyModel>] = &[
    ("addSection", |db, a| { db.add_section(a.str(0)?); done() }),
    ("addTask", |db, a| { db.add_task(a.str(0)?, a.str(1)?); done() }),
];
static REQUIREMENT: &[Method<RequirementModel>] = &[
    ("addRequirement", |db, a| { db.add_requirement(a.str(0)?, a.named(1, &REQUIREMENT_TYPES, RequirementType::name)?); done() }),
    ("setNewReqId", |db, a| { db.set_new_req_id(a.str(0)?); done() }),
    ("setNewReqText", |db, a| { db.set_new_req_text(a.str(0)?); done() }),
    ("setNewReqRisk", |db, a| { db.set_new_req_risk(a.named(0, &RISKS, Risk::name)?); done() }),
    ("setNewReqVerifyMethod", |db, a| { db.set_new_req_verify_method(a.named(0, &VERIFY_METHODS, VerifyMethod::name)?); done() }),
    ("addElement", |db, a| { db.add_element(a.str(0)?); done() }),
    ("setNewElementType", |db, a| { db.set_new_element_type(a.str(0)?); done() }),
    ("setNewElementDocRef", |db, a| { db.set_new_element_doc_ref(a.str(0)?); done() }),
    ("addRelationship", |db, a| { db.add_relationship(a.named(0, &RELATIONSHIPS, Relationship::name)?, a.str(1)?, a.str(2)?); done() }),
    ("setCssStyle", |db, a| native(db.set_css_style(&a.strs(0)?, &a.strings(1)?))),
    ("setClass", |db, a| native(db.set_class(&a.strs(0)?, &a.strs(1)?))),
    ("defineClass", |db, a| native(db.define_class(&a.strs(0)?, &a.strings(1)?))),
];
static RAILROAD: &[Method<RailroadDb>] = &[("setTitle", |db, a| { db.titles.set_title(a.str(0)?); done() })];
static STATE: &[Method<StateModel>] = &[
    // add_state's doc, description, note and class parameters take parsed statements; only
    // the id and type are passed.
    ("addState", |db, a| {
        let kind = if a.at(1).is_null() { None } else { Some(a.serialized(1, &STATE_KINDS)?) };
        a.none_from(2)?;
        db.add_state(a.str(0)?, kind, None, None, None, None);
        done()
    }),
    ("addDescription", |db, a| { db.add_description(a.str(0)?, a.str(1)?); done() }),
    ("addStyleClass", |db, a| { db.add_style_class(a.str(0)?, a.str(1)?); done() }),
    ("setCssClass", |db, a| { db.set_css_class(a.str(0)?, a.str(1)?); done() }),
    ("addLink", |db, a| { db.add_link(a.str(0)?, a.str(1)?, a.str(2)?); done() }),
];
static MINDMAP: &[Method<MindmapModel>] = &[
    ("addNode", |db, a| native(db.add_node(a.index(0)?, a.str(1)?, a.str(2)?, a.serialized(3, &OUTLINE_NODE_TYPES)?, a.opt_str(4)?))),
    ("decorateNode", |db, a| {
        let Some(decoration) = a.at(0).as_object() else { return a.wrong(0, "an object") };
        if decoration.keys().any(|key| key != "icon" && key != "class") { return a.wrong(0, "an object of icon and class") }
        let (icon, class) = (text(decoration, "icon"), text(decoration, "class"));
        db.decorate_node(icon.as_deref(), class.as_deref());
        done()
    }),
];
static CLASS: &[Method<ClassModel>] = &[
    ("addClass", |db, a| { db.add_class(a.str(0)?); done() }),
    ("setClassLabel", |db, a| { db.set_class_label(a.str(0)?, a.str(1)?); done() }),
    ("addAnnotation", |db, a| { db.add_annotation(a.str(0)?, a.str(1)?); done() }),
    ("addMember", |db, a| { db.add_member(a.str(0)?, a.str(1)?); done() }),
    ("addNote", |db, a| returns(db.add_note(a.str(0)?, a.opt_str(1)?))),
    ("setCssClass", |db, a| { db.set_css_class(a.str(0)?, a.str(1)?); done() }),
    ("defineClass", |db, a| { db.define_class(&a.strs(0)?, &a.strings(1)?); done() }),
    ("setTooltip", |db, a| { db.set_tooltip(a.str(0)?, a.str(1)?); done() }),
    ("setLink", |db, a| { db.set_link(a.str(0)?, a.str(1)?, a.opt_str(2)?); done() }),
    ("setClickEvent", |db, a| { db.set_click_event(a.str(0)?); done() }),
    ("addNamespace", |db, a| returns(db.add_namespace(a.str(0)?, a.opt_str(1)?))),
    ("addClassesToNamespace", |db, a| { db.add_classes_to_namespace(a.str(0)?, &a.strings(1)?, &a.strings(2)?); done() }),
    ("setCssStyle", |db, a| { db.set_css_style(a.str(0)?, &a.strings(1)?); done() }),
];
static FLOWCHART: &[Method<FlowDb>] = &[
    ("addClass", |db, a| { db.add_class(a.str(0)?, &a.strings(1)?); done() }),
    ("setClass", |db, a| { db.set_class(a.str(0)?, a.str(1)?); done() }),
    ("setTooltip", |db, a| { db.set_tooltip(a.str(0)?, a.str(1)?); done() }),
    ("setLink", |db, a| { db.set_link(a.str(0)?, a.str(1)?, a.opt_str(2)?); done() }),
    ("setClickEvent", |db, a| { db.set_click_event(a.str(0)?); done() }),
    ("updateLinkInterpolate", |db, a| native(db.update_link_interpolate(&a.strings(0)?, a.str(1)?))),
    ("updateLink", |db, a| native(db.update_link(&a.strings(0)?, a.strings(1)?))),
];
/// Mermaid's emitWarning(id, message, { nodeId }): Bezel's emit_* always take the node id.
fn emit(a: &Args, warning: bool, db: &mut AgentflowDb) -> Out {
    let id = a.serialized(0, &DIAGNOSTIC_IDS)?;
    let message = a.str(1)?.to_string();
    let node = a.at(2).as_object().and_then(|context| text(context, "nodeId"));
    let Some(node) = node else { return a.wrong(2, "a context with the nodeId Bezel's emit_warning and emit_error require") };
    if warning { db.emit_warning(id, message, &node) } else { db.emit_error(id, message, &node) }
    done()
}
static AGENTFLOW: &[Method<AgentflowDb>] = &[
    ("emitWarning", |db, a| emit(a, true, db)),
    ("emitError", |db, a| emit(a, false, db)),
    ("updateLinkInterpolate", |db, a| native(db.store.update_link_interpolate(&a.strings(0)?, a.str(1)?))),
    ("updateLink", |db, a| native(db.store.update_link(&a.strings(0)?, a.strings(1)?))),
];
fn quadrant_text(a: &Args, i: usize) -> Result<QuadrantText, Fail> {
    a.record(i, |object| Some(QuadrantText { text: text(object, "text")?, kind: serialized(field(object, "type")?, &TEXT_KINDS)? }))
}
static QUADRANT: &[Method<QuadrantModel>] = &[
    ("parseStyles", |_, a| PointStyle::parse(&a.strings(0)?).map_err(Fail::Native).and_then(returns)),
    ("setXAxisLeftText", |db, a| { db.set_x_axis_left_text(quadrant_text(a, 0)?); done() }),
    ("setXAxisRightText", |db, a| { db.set_x_axis_right_text(quadrant_text(a, 0)?); done() }),
    ("setYAxisBottomText", |db, a| { db.set_y_axis_bottom_text(quadrant_text(a, 0)?); done() }),
    ("setYAxisTopText", |db, a| { db.set_y_axis_top_text(quadrant_text(a, 0)?); done() }),
    ("addClass", |db, a| native(db.add_class(a.str(0)?.to_string(), &a.strings(1)?))),
];
fn arch_node(object: &Map<String, Value>) -> Option<ArchNode> {
    Some(ArchNode {
        id: text(object, "id")?,
        kind: serialized(field(object, "type")?, &ARCH_NODE_KINDS)?,
        icon: text(object, "icon"),
        icon_text: text(object, "iconText"),
        title: text(object, "title"),
        parent: text(object, "in"),
    })
}
static ARCHITECTURE: &[Method<ArchitectureModel>] = &[
    ("addService", |db, a| native(db.add_service(a.record(0, arch_node)?))),
    // Mermaid passes the junction's record; Bezel's add_junction takes its id and parent.
    ("addJunction", |db, a| {
        let node = a.record(0, arch_node)?;
        if node.kind != ArchNodeKind::Junction || node.icon.is_some() || node.icon_text.is_some() || node.title.is_some() { return a.wrong(0, "a junction record of id, type and in") }
        native(db.add_junction(node.id, node.parent))
    }),
    ("addGroup", |db, a| {
        native(db.add_group(a.record(0, |object| Some(ArchGroup { id: text(object, "id")?, icon: text(object, "icon"), title: text(object, "title"), parent: text(object, "in") }))?))
    }),
    ("addLayoutHint", |db, a| {
        native(db.add_layout_hint(a.record(0, |object| {
            let members = field(object, "members")?.as_array()?.iter().map(|m| m.as_str().map(String::from)).collect::<Option<Vec<_>>>()?;
            Some(ArchLayoutHint { direction: serialized(field(object, "direction")?, &ALIGNMENTS)?, members })
        })?))
    }),
];

/// One family's members: its own, then Mermaid's common text setters where its model has
/// the public `titles` (common/db.rs:37-45 set_title, set_acc_title, set_acc_descr).
fn find<D: Common>(own: &[Method<D>], member: &str) -> Option<fn(&mut D, &Args) -> Out> {
    own.iter().find(|(name, _)| *name == member).map(|(_, f)| *f).or_else(|| D::common(member))
}
fn names<D: Common>(own: &[Method<D>]) -> Vec<&'static str> {
    own.iter().map(|(name, _)| *name).chain(D::COMMON_NAMES.iter().copied()).collect()
}
trait Common: Sized {
    const COMMON_NAMES: &'static [&'static str] = &[];
    fn common(_member: &str) -> Option<fn(&mut Self, &Args) -> Out> {
        None
    }
}
macro_rules! common_titles {
    ($($ty:ty),*) => {$(
        impl Common for $ty {
            const COMMON_NAMES: &'static [&'static str] = &["setDiagramTitle", "setAccTitle", "setAccDescription"];
            fn common(member: &str) -> Option<fn(&mut Self, &Args) -> Out> {
                let method: fn(&mut Self, &Args) -> Out = match member {
                    "setDiagramTitle" => |db, a| { db.titles.set_title(a.str(0)?); done() },
                    "setAccTitle" => |db, a| { db.titles.set_acc_title(a.str(0)?); done() },
                    "setAccDescription" => |db, a| { db.titles.set_acc_descr(a.str(0)?); done() },
                    _ => return None,
                };
                Some(method)
            }
        }
    )*};
}
common_titles!(GanttDb, JourneyModel, RequirementModel, RailroadDb, StateModel, ClassModel, FlowDb, QuadrantModel, ArchitectureModel, TreeViewModel);
impl Common for MindmapModel {}
impl Common for AgentflowDb {}

static TREEVIEW: &[Method<TreeViewModel>] = &[];

/// The members each family binds, by the runtime's family names.
pub fn describe() -> Value {
    json!({
        "gantt": names(GANTT), "journey": names(JOURNEY), "requirement": names(REQUIREMENT), "railroad": names(RAILROAD),
        "state": names(STATE), "mindmap": names(MINDMAP), "class": names(CLASS), "flowchart": names(FLOWCHART),
        "agentflow": names(AGENTFLOW), "quadrant": names(QUADRANT), "architecture": names(ARCHITECTURE), "treeview": names(TREEVIEW),
    })
}

fn call(model: &mut Model, family: &str, member: &str, args: &Args) -> Out {
    macro_rules! dispatch {
        ($db:expr, $table:expr) => {
            find($table, member).map(|method| method($db, args))
        };
    }
    let bound = match (family, &mut *model) {
        ("gantt", Model::Gantt(db)) => dispatch!(db, GANTT),
        ("journey", Model::Journey(db)) => dispatch!(db, JOURNEY),
        ("requirement", Model::Requirement(db)) => dispatch!(db, REQUIREMENT),
        (f, Model::Railroad(db)) if f.starts_with("railroad") => dispatch!(db, RAILROAD),
        ("state", Model::State(db)) => dispatch!(db, STATE),
        ("mindmap", Model::Mindmap(db)) => dispatch!(db, MINDMAP),
        ("class", Model::Class(db)) => dispatch!(db, CLASS),
        ("flowchart", Model::Flowchart(db)) => dispatch!(db, FLOWCHART),
        ("agentflow", Model::Agentflow(db)) => dispatch!(db, AGENTFLOW),
        ("quadrant", Model::Quadrant(db)) => dispatch!(db, QUADRANT),
        ("architecture", Model::Architecture(db)) => dispatch!(db, ARCHITECTURE),
        ("treeview", Model::TreeView(db)) => dispatch!(db, TREEVIEW),
        _ => None,
    };
    bound.unwrap_or_else(|| gap(format!("bezel binds no {family} database {member} on a {} model", model_name(model))))
}
fn model_name(model: &Model) -> String {
    serde_json::to_value(model).ok().and_then(|v| v.get("type").and_then(Value::as_str).map(String::from)).unwrap_or_else(|| "parsed".into())
}

/// A fresh database (Mermaid's `new XDB()` and `clear()`): the family database type's own
/// public constructor, as its `Diagram::parse` makes it (mindmap with no title). A family
/// whose database is built only with options or from a parse (flowchart and agentflow take
/// store options, treeview's database is private) starts from Bezel's own parse of the
/// header-only diagram instead.
fn fresh(family: &str, header: &str) -> Result<Model, Reply> {
    Ok(match family {
        "gantt" => Model::Gantt(Box::new(GanttDb::new())),
        "journey" => Model::Journey(JourneyModel::new()),
        "requirement" => Model::Requirement(Box::default()),
        f if f.starts_with("railroad") => Model::Railroad(RailroadDb::default()),
        "state" => Model::State(Box::new(StateModel::new())),
        "mindmap" => Model::Mindmap(MindmapModel::new(None)),
        "class" => Model::Class(Box::default()),
        "quadrant" => Model::Quadrant(QuadrantModel::default()),
        "architecture" => Model::Architecture(Box::new(ArchitectureModel::new())),
        _ => return parsed(family, header),
    })
}
fn parsed(family: &str, source: &str) -> Result<Model, Reply> {
    match mermaid::parse(source, &Options::default()) {
        Ok(parsed) if family_matches(parsed.kind.name(), family) => Ok(parsed.model),
        Ok(parsed) => Err(Reply::AdapterGap(format!("bezel database parse detected {}, not {family}", parsed.kind.name()))),
        Err(error) => Err(Reply::AdapterGap(format!("bezel has no empty {family} database: it refuses the diagram the database starts from ({})", error.message))),
    }
}

/// Replay `ops` on one database and report the last operation.
pub fn run(family: &str, ops: &[Value]) -> Reply {
    let mut model: Option<Model> = None;
    let mut outcome: Result<Option<Value>, Error> = Ok(None);
    for (i, op) in ops.iter().enumerate() {
        let last = i + 1 == ops.len();
        let start = match (op.get("parse").and_then(Value::as_str), op.get("new").and_then(Value::as_str)) {
            (Some(source), _) => Some(parsed(family, source)),
            (None, Some(header)) => Some(fresh(family, header)),
            (None, None) => None,
        };
        if let Some(start) = start {
            match start {
                Ok(started) => model = Some(started),
                Err(reply) => return reply,
            }
        } else if let (Some(member), Some(args)) = (op.get("call").and_then(Value::as_str), op.get("args").and_then(Value::as_array)) {
            let Some(db) = model.as_mut() else { return Reply::AdapterGap("bezel database call before any database".into()) };
            match call(db, family, member, &Args(args, member)) {
                Ok(value) => outcome = Ok(value),
                Err(Fail::Gap(message)) => return Reply::AdapterGap(message),
                Err(Fail::Native(error)) => outcome = Err(error),
            }
            if !last {
                outcome = Ok(None);
            }
        } else {
            return Reply::AdapterGap(format!("bezel database operation {i} is neither parse, new nor call"));
        }
    }
    let Some(model) = model else { return Reply::AdapterGap("bezel database request has no operations".into()) };
    let serialized = match serde_json::to_value(&model) {
        Ok(value) => value,
        Err(error) => return Reply::AdapterGap(format!("bezel model did not serialize: {error}")),
    };
    let mut reply = Map::new();
    reply.insert("model".into(), serialized);
    match outcome {
        Ok(Some(result)) => { reply.insert("result".into(), result); }
        Ok(None) => {}
        Err(error) => { reply.insert("error".into(), json!({ "name": "Error", "code": format!("{:?}", error.code), "message": error.message })); }
    }
    Reply::Value(Value::Object(reply))
}
