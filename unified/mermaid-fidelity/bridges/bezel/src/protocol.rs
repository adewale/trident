// Bridge plumbing shared (by copy) between the Rust parser bridges: read the
// request, run the project's parser under catch_unwind, print one reply line,
// and a `ToJson` trait that maps the project's types by hand to JSON with their
// native field names. See ../../bridges.ts for the protocol.
#![allow(dead_code)]
use serde_json::{Map, Value, json};
use std::collections::{BTreeMap, HashMap};
use std::io::Read;

pub enum Reply {
    Value(Value),
    ParseError(String),
    Unsupported(String),
    AdapterGap(String),
}

/// Read `{"family", "source"}`, call `run`, and print exactly one reply line.
pub fn serve(run: impl FnOnce(&str, &str) -> Reply + std::panic::UnwindSafe) {
    let mut input = String::new();
    let reply = match std::io::stdin().read_to_string(&mut input) {
        Err(error) => Reply::AdapterGap(format!("could not read stdin: {error}")),
        Ok(_) => match serde_json::from_str::<Value>(&input) {
            Err(error) => Reply::AdapterGap(format!("request is not JSON: {error}")),
            Ok(request) => match (request["family"].as_str(), request["source"].as_str()) {
                (Some(family), Some(source)) => {
                    let (family, source) = (family.to_string(), source.to_string());
                    std::panic::set_hook(Box::new(|_| {}));
                    match std::panic::catch_unwind(move || run(&family, &source)) {
                        Ok(reply) => reply,
                        Err(payload) => {
                            let message = payload
                                .downcast_ref::<&str>()
                                .map(|s| s.to_string())
                                .or_else(|| payload.downcast_ref::<String>().cloned())
                                .unwrap_or_else(|| "non-string panic payload".into());
                            Reply::AdapterGap(format!("parser panicked: {message}"))
                        }
                    }
                }
                _ => Reply::AdapterGap("request lacks string family/source".into()),
            },
        },
    };
    let line = match reply {
        Reply::Value(value) => json!({ "value": value }),
        Reply::ParseError(message) => json!({ "error": { "name": "ParseError", "message": message } }),
        Reply::Unsupported(message) => json!({ "unsupported": message }),
        Reply::AdapterGap(message) => json!({ "adapterGap": message }),
    };
    println!("{line}");
}

fn norm(value: &str) -> String {
    let mut s: String = value.to_lowercase().chars().filter(|c| c.is_ascii_alphanumeric()).collect();
    loop {
        let before = s.len();
        for suffix in ["v2", "beta", "diagram", "chart"] {
            if s.len() > suffix.len() && s.ends_with(suffix) {
                s.truncate(s.len() - suffix.len());
            }
        }
        if s.len() == before {
            return s;
        }
    }
}

/// Whether a diagram type the project itself reported is the requested family
/// (same rule as ../common.mjs familyMatches).
pub fn family_matches(reported: &str, family: &str) -> bool {
    let r = norm(reported);
    let wanted: Vec<String> = match family {
        "er" => vec!["er".into(), "entityrelationship".into()],
        "gitgraph" => vec!["git".into(), "gitgraph".into()],
        "c4" => ["c4", "c4context", "c4container", "c4component", "c4dynamic", "c4deployment"].map(String::from).to_vec(),
        "state" => vec!["state".into(), "statediagram".into()],
        "class" => vec!["class".into(), "classdiagram".into()],
        "swimlanes" => vec!["swimlane".into(), "swimlanes".into()],
        other => vec![norm(other)],
    };
    wanted.iter().any(|name| r == *name || r.starts_with(name.as_str()))
}

/// Hand-written JSON mapping of a project value.
pub trait ToJson {
    fn to_json(&self) -> Value;
}

impl ToJson for String { fn to_json(&self) -> Value { Value::String(self.clone()) } }
impl ToJson for str { fn to_json(&self) -> Value { Value::String(self.to_string()) } }
impl ToJson for char { fn to_json(&self) -> Value { Value::String(self.to_string()) } }
impl ToJson for bool { fn to_json(&self) -> Value { Value::Bool(*self) } }
macro_rules! ints { ($($t:ty),*) => { $(impl ToJson for $t { fn to_json(&self) -> Value { json!(*self) } })* } }
ints!(u8, u16, u32, u64, usize, i8, i16, i32, i64, isize);
impl ToJson for f64 {
    fn to_json(&self) -> Value { serde_json::Number::from_f64(*self).map(Value::Number).unwrap_or(Value::Null) }
}
impl ToJson for f32 {
    // Through the shortest decimal form, so 0.1f32 prints as 0.1 rather than 0.10000000149011612.
    fn to_json(&self) -> Value { self.to_string().parse::<f64>().map(|v| v.to_json()).unwrap_or(Value::Null) }
}
impl ToJson for Value { fn to_json(&self) -> Value { self.clone() } }
impl<T: ToJson + ?Sized> ToJson for &T { fn to_json(&self) -> Value { (**self).to_json() } }
impl<T: ToJson + ?Sized> ToJson for Box<T> { fn to_json(&self) -> Value { (**self).to_json() } }
impl<T: ToJson> ToJson for Option<T> {
    fn to_json(&self) -> Value { self.as_ref().map_or(Value::Null, ToJson::to_json) }
}
impl<T: ToJson> ToJson for [T] { fn to_json(&self) -> Value { Value::Array(self.iter().map(ToJson::to_json).collect()) } }
impl<T: ToJson> ToJson for Vec<T> { fn to_json(&self) -> Value { self.as_slice().to_json() } }
impl<T: ToJson, const N: usize> ToJson for [T; N] { fn to_json(&self) -> Value { self.as_slice().to_json() } }
impl<A: ToJson, B: ToJson> ToJson for (A, B) { fn to_json(&self) -> Value { json!([self.0.to_json(), self.1.to_json()]) } }
/// HashMap iteration order is arbitrary; keys are sorted so replies are deterministic.
impl<K: ToString, V: ToJson, S> ToJson for HashMap<K, V, S> {
    fn to_json(&self) -> Value {
        let mut entries: Vec<(String, Value)> = self.iter().map(|(k, v)| (k.to_string(), v.to_json())).collect();
        entries.sort_by(|a, b| a.0.cmp(&b.0));
        Value::Object(entries.into_iter().collect())
    }
}
impl<K: ToString, V: ToJson> ToJson for BTreeMap<K, V> {
    fn to_json(&self) -> Value { Value::Object(self.iter().map(|(k, v)| (k.to_string(), v.to_json())).collect()) }
}

/// Object from (native field name, value) pairs, in declaration order.
pub fn object(fields: Vec<(&str, Value)>) -> Value {
    let mut map = Map::new();
    for (name, value) in fields {
        map.insert(name.to_string(), value);
    }
    Value::Object(map)
}

/// `ToJson` for a struct with visible fields. The pattern destructures every
/// field without `..`, so the build fails if the project's struct gains or
/// loses a field the mapping does not list.
#[macro_export]
macro_rules! record {
    ($($seg:ident)::+ { $($field:ident),* $(,)? }) => {
        impl $crate::protocol::ToJson for $($seg)::+ {
            fn to_json(&self) -> serde_json::Value {
                let $($seg)::+ { $($field),* } = self;
                $crate::protocol::object(vec![$((stringify!($field), $crate::protocol::ToJson::to_json($field))),*])
            }
        }
    };
}

/// `ToJson` for a fieldless enum: its variant name. The match is exhaustive,
/// so the build fails if the project's enum gains a variant.
#[macro_export]
macro_rules! variants {
    ($($seg:ident)::+ { $($variant:ident),* $(,)? }) => {
        impl $crate::protocol::ToJson for $($seg)::+ {
            fn to_json(&self) -> serde_json::Value {
                serde_json::Value::String(match self { $(Self::$variant => stringify!($variant)),* }.to_string())
            }
        }
    };
}
