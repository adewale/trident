// orestesgaolin/mermaid (Mermaid Dart) and pub:mermaid_flutter: call mermaid_core
// 0.3.2's own parser for the requested family and print the model it returns.
// See ../../../bridges.ts for the reply protocol. The bridge parses nothing itself.
//
// Models have no toJson, so their public instance fields are read through
// lib/model_fields.g.dart, generated at build time by reflecting on mermaid_core's
// classes. Enums print as their names; Map, Set and DateTime keep their native kind;
// positional records print as arrays.
import 'dart:convert';
import 'dart:io';

import 'package:mermaid_core/mermaid_core.dart' show MermaidParseException;
import 'package:trident_mermaid_core_bridge/families.dart';
import 'package:trident_mermaid_core_bridge/model_fields.g.dart';

class _Unserializable implements Exception {
  _Unserializable(this.message);
  final String message;
}

final _open =
    Set<Object>.identity(); // objects being written, to drop back-references

Object? encode(Object? v) {
  if (v == null || v is bool || v is String || v is int) return v;
  if (v is double) return v.isFinite ? v : null;
  if (v is Enum) return v.name;
  if (v is DateTime)
    return {'__tridentNativeDate': v.toUtc().toIso8601String()};
  if (_open.contains(v)) return null;
  _open.add(v);
  try {
    if (v is Map)
      return {
        '__tridentNativeMap': [
          for (final e in v.entries) [encode(e.key), encode(e.value)],
        ],
      };
    if (v is Set)
      return {
        '__tridentNativeSet': [for (final e in v) encode(e)],
      };
    if (v is Iterable) return [for (final e in v) encode(e)];
    if (v is Record) return _positional(v).map(encode).toList();
    final fields = modelFields(v);
    if (fields == null)
      throw _Unserializable(
        'mermaid_core returned a ${v.runtimeType}, which the bridge has no field list for',
      );
    return {
      for (final (name, value) in fields)
        if (!_isBackReference(name, value)) name: encode(value),
    };
  } finally {
    _open.remove(v);
  }
}

/// A positional-only record's fields in order, printed as an array (a tuple). Records
/// cannot be inspected generically, so each arity is matched by its own pattern.
List<Object?> _positional(Record r) => switch (r) {
  (var a,) => [a],
  (var a, var b) => [a, b],
  (var a, var b, var c) => [a, b, c],
  (var a, var b, var c, var d) => [a, b, c, d],
  (var a, var b, var c, var d, var e) => [a, b, c, d, e],
  (var a, var b, var c, var d, var e, var f) => [a, b, c, d, e, f],
  (var a, var b, var c, var d, var e, var f, var g) => [a, b, c, d, e, f, g],
  (var a, var b, var c, var d, var e, var f, var g, var h) => [
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
  ],
  _ => throw _Unserializable(
    'mermaid_core returned a record ${r.runtimeType} with named or more than 8 fields, which the bridge cannot read',
  ),
};

bool _isBackReference(String name, Object? value) =>
    value != null &&
    value is! String &&
    value is! num &&
    value is! bool &&
    value is! Enum &&
    (name == 'parent' || _open.contains(value));

void reply(Object reply) => stdout.writeln(jsonEncode(reply));

Future<void> main() async {
  Map<String, Object?> request;
  try {
    request = (jsonDecode(await stdin.transform(utf8.decoder).join()) as Map)
        .cast();
  } catch (e) {
    reply({'adapterGap': 'bridge request was not JSON: $e'});
    return;
  }
  final family = request['family'], source = request['source'];
  if (family is! String || source is! String) {
    reply({'adapterGap': 'bridge request lacks string family and source'});
    return;
  }
  final parser = parsers[family];
  if (parser == null) {
    reply({'unsupported': 'mermaid_core 0.3.2 has no $family parser'});
    return;
  }
  final Object model;
  try {
    model = parser.$2(source);
  } on MermaidParseException catch (e) {
    reply({
      'error': {'name': 'ParseError', 'message': e.toString()},
    });
    return;
  } on UnsupportedError catch (e) {
    reply({'unsupported': 'mermaid_core ${parser.$1}: ${e.message ?? e}'});
    return;
  } catch (e) {
    reply({
      'adapterGap': 'mermaid_core ${parser.$1} threw ${e.runtimeType}: $e',
    });
    return;
  }
  try {
    reply({'value': encode(model)});
  } on _Unserializable catch (e) {
    reply({'adapterGap': e.message});
  } catch (e) {
    reply({
      'adapterGap':
          'bridge could not read the ${model.runtimeType} model: ${e.runtimeType}: $e',
    });
  }
}
