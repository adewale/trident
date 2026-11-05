// Build-time generator (JIT, dart:mirrors): writes lib/model_fields.g.dart, which
// lists the public instance fields of every model class the bridge's parsers can
// return, so the AOT-compiled bridge can read them without mirrors. Fields come
// from reflection on mermaid_core's own classes; nothing is named by hand.
//
// Starting from each parser's declared return type it follows the static types of
// public instance fields (and their type arguments), and adds every public class
// in the same packages that implements or extends a class already reached.
//
// A concrete class that extends or implements an abstract model class (a sealed
// expression or event hierarchy) is one of several kinds of the same declared type, so
// its class name is listed too: the bridge prints it as `$class`, the only field that
// tells such kinds apart when their own fields coincide (SeqCreate and SeqDestroy).
//
//   dart run tool/gen.dart <output file>
import 'dart:io';
import 'dart:mirrors';

import 'package:trident_mermaid_core_bridge/families.dart';

bool fromPackage(LibraryMirror l) =>
    l.uri.scheme == 'package' &&
    l.uri.pathSegments.first != 'trident_mermaid_core_bridge';

bool isObject(ClassMirror c) => c.qualifiedName == #dart.core.Object;

String libName(ClassMirror c) => (c.owner as LibraryMirror).uri.toString();

/// Public instance fields in declaration order, superclass (and mixin) fields first.
List<String> fieldsOf(ClassMirror c) {
  final chain = <ClassMirror>[];
  for (ClassMirror? k = c; k != null && !isObject(k); k = k.superclass) {
    chain.insert(0, k);
  }
  final names = <String>[];
  for (final k in chain) {
    final source = k.mixin;
    for (final d in source.declarations.values) {
      if (d is VariableMirror && !d.isStatic && !d.isPrivate) {
        final name = MirrorSystem.getName(d.simpleName);
        if (!names.contains(name)) names.add(name);
      }
    }
  }
  return names;
}

Iterable<ClassMirror> typesIn(TypeMirror t) sync* {
  if (t is ClassMirror) {
    yield t.originalDeclaration as ClassMirror;
    for (final a in t.typeArguments) {
      yield* typesIn(a);
    }
  } else if (t is TypedefMirror) {
    yield* typesIn(t.referent.returnType);
  }
}

Set<ClassMirror> supertypes(ClassMirror c) {
  final out = <ClassMirror>{};
  void visit(ClassMirror k) {
    final o = k.originalDeclaration as ClassMirror;
    if (!out.add(o)) return;
    if (k.superclass != null) visit(k.superclass!);
    for (final i in k.superinterfaces) {
      visit(i);
    }
    if (k.mixin != k) visit(k.mixin);
  }

  visit(c);
  out.remove(c.originalDeclaration);
  return out;
}

void main(List<String> args) {
  final pool = <ClassMirror>[
    for (final l in currentMirrorSystem().libraries.values)
      if (fromPackage(l))
        for (final d in l.declarations.values)
          if (d is ClassMirror && !d.isPrivate && !d.isEnum) d,
  ];
  final reached = <ClassMirror>{};
  final pending = <ClassMirror>[];
  final untyped = <String>{};
  final records = <String>{}; // record shapes are invisible to mirrors; bin/bridge.dart reads positional ones
  void reach(ClassMirror c) {
    final o = c.originalDeclaration as ClassMirror;
    if (o.isPrivate || o.isEnum || !fromPackage(o.owner as LibraryMirror))
      return;
    if (reached.add(o)) pending.add(o);
  }

  for (final entry in parsers.entries) {
    final fn = (reflect(entry.value.$2) as ClosureMirror).function;
    final roots = typesIn(fn.returnType).toList();
    if (roots.isEmpty)
      throw StateError('${entry.value.$1} has no class return type');
    roots.forEach(reach);
  }
  while (true) {
    while (pending.isNotEmpty) {
      final c = pending.removeLast();
      for (ClassMirror? k = c; k != null && !isObject(k); k = k.superclass) {
        for (final d in k.mixin.declarations.values) {
          if (d is VariableMirror && !d.isStatic && !d.isPrivate) {
            final types = typesIn(d.type).toList();
            if (types.any((t) => t.qualifiedName == #dart.core.Record)) {
              records.add(
                '${MirrorSystem.getName(c.simpleName)}.${MirrorSystem.getName(d.simpleName)}',
              );
            }
            if (d.type is! ClassMirror || types.any((t) => isObject(t))) {
              untyped.add(
                '${MirrorSystem.getName(c.simpleName)}.${MirrorSystem.getName(d.simpleName)}',
              );
            }
            types.forEach(reach);
          }
        }
      }
    }
    final more = pool
        .where(
          (c) => !reached.contains(c) && supertypes(c).any(reached.contains),
        )
        .toList();
    if (more.isEmpty) break;
    more.forEach(reach);
  }

  final concrete = reached.where((c) => !c.isAbstract).toList()
    ..sort((a, b) {
      final byDepth = supertypes(b).length
          .compareTo(supertypes(a).length); // most specific first
      return byDepth != 0
          ? byDepth
          : '${libName(a)}#${a.simpleName}'.compareTo(
              '${libName(b)}#${b.simpleName}',
            );
    });
  final libraries = {for (final c in concrete) libName(c)}.toList()..sort();
  final prefix = {
    for (var i = 0; i < libraries.length; i++) libraries[i]: 'l$i',
  };

  final out = StringBuffer()
    ..writeln(
      '// GENERATED by tool/gen.dart from mermaid_core\'s own classes via dart:mirrors. Do not edit.',
    )
    ..writeln('// ignore_for_file: implementation_imports')
    ..writeln();
  for (final l in libraries) {
    out.writeln("import '$l' as ${prefix[l]};");
  }
  out
    ..writeln()
    ..writeln(
      '/// Each model class in the parsers\' output, most specific first, with its public instance fields.',
    )
    ..writeln('/// Null when [o] is none of them.')
    ..writeln('List<(String, Object?)>? modelFields(Object o) {');
  for (final c in concrete) {
    final name = '${prefix[libName(c)]}.${MirrorSystem.getName(c.simpleName)}';
    final fields = fieldsOf(c).map((f) => "('$f', o.$f)").join(', ');
    out.writeln('  if (o is $name) return [$fields];');
  }
  out
    ..writeln('  return null;')
    ..writeln('}')
    ..writeln();
  final kinds = [
    for (final c in concrete)
      if (supertypes(c).any((s) => reached.contains(s) && s.isAbstract)) c,
  ];
  out
    ..writeln(
      '/// The class name of a model object that is one kind of an abstract model class, else null.',
    )
    ..writeln('String? modelKind(Object o) {');
  for (final c in kinds) {
    final simple = MirrorSystem.getName(c.simpleName);
    out.writeln("  if (o is ${prefix[libName(c)]}.$simple) return '$simple';");
  }
  out
    ..writeln('  return null;')
    ..writeln('}')
    ..writeln()
    ..writeln(
      '/// Fields whose static type does not name a model class (dynamic/Object/function): ${untyped.isEmpty ? 'none' : (untyped.toList()..sort()).join(', ')}.',
    )
    ..writeln(
      '/// Fields holding records: ${records.isEmpty ? 'none' : (records.toList()..sort()).join(', ')}.',
    );
  File(args.single).writeAsStringSync(out.toString());
  stderr.writeln(
    'gen: ${concrete.length} model classes from ${libraries.length} libraries; untyped fields: ${untyped.length}; record fields: ${records.length}; kinds: ${kinds.map((c) => MirrorSystem.getName(c.simpleName)).join(', ')}',
  );
}
