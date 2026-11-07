import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

const _signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
Future<String?> nativePngAdmission(Uint8List? bytes) async {
  if (bytes == null || bytes.length < 24) return 'not a PNG';
  for (var i = 0; i < _signature.length; i++) { if (bytes[i] != _signature[i]) return 'not a PNG'; }
  if (String.fromCharCodes(bytes.sublist(12, 16)) != 'IHDR') return 'PNG has no IHDR';
  final view = ByteData.sublistView(bytes);
  final width = view.getUint32(16), height = view.getUint32(20);
  if (width == 0 || height == 0) return 'zero-size PNG';
  if (bytes.length > 64 * 1024 * 1024 || width > (16 * 1024 * 1024) ~/ height) return 'PNG exceeds validation budget';
  ui.Codec? codec;
  ui.Image? image;
  try {
    codec = await ui.instantiateImageCodec(bytes);
    image = (await codec.getNextFrame()).image;
  } catch (_) {
    return 'PNG could not be decoded';
  } finally {
    image?.dispose();
    codec?.dispose();
  }
  return null;
}


/** Fixed independently encoded RGBA PNG; no candidate supplies the positive fixture. */
Future<List<String>> nativePngAdmissionControls() async {
  final valid = Uint8List.fromList(base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAFElEQVR4AQEJAPb/AAAAAP//////DvoE/Kb2Mo8AAAAASUVORK5CYII='));
  Uint8List dimensions(int width, int height) {
    final bytes = Uint8List.fromList(valid);
    final view = ByteData.sublistView(bytes);
    view.setUint32(16, width); view.setUint32(20, height);
    return bytes;
  }
  final oversized = Uint8List(64 * 1024 * 1024 + 1)..setRange(0, valid.length, valid);
  final fixtures = <String, Uint8List?>{
    'valid': valid,
    'null': null,
    'empty': Uint8List(0),
    'non-png': Uint8List.fromList(List<int>.filled(24, 65)),
    'truncated-ihdr': Uint8List.fromList(valid.sublist(0, 24)),
    'zero-size': dimensions(0, 1),
    'excessive-pixels': dimensions(4097, 4096),
    'overflow-dimensions': dimensions(0xffffffff, 0xffffffff),
    'excessive-encoded-bytes': oversized,
  };
  final checked = <String>[];
  for (final fixture in fixtures.entries) {
    final reason = await nativePngAdmission(fixture.value);
    if ((reason == null) != (fixture.key == 'valid')) throw StateError('PNG admission control failed: ' + fixture.key);
    checked.add(fixture.key);
  }
  return checked;
}
