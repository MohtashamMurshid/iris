import ExpoModulesCore
import AVFoundation
import CoreImage
import ImageIO
import UniformTypeIdentifiers

public class IrisProcessingModule: Module {
  private let queue = DispatchQueue(label: "iris.processing", qos: .userInitiated)
  private let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
  private lazy var context = CIContext(options: [.workingColorSpace: colorSpace, .outputColorSpace: colorSpace, .cacheIntermediates: false])

  public func definition() -> ModuleDefinition {
    Name("IrisProcessing")

    // VisionCamera and Core Image use tmp, which is separate from Expo's cache directory.
    AsyncFunction("releaseTemporary") { (source: String) in
      guard let url = URL(string: source), url.isFileURL else { return }
      let file = url.resolvingSymlinksInPath().standardizedFileURL
      let root = FileManager.default.temporaryDirectory.resolvingSymlinksInPath().standardizedFileURL
      guard file.path.hasPrefix(root.path.hasSuffix("/") ? root.path : root.path + "/"),
            FileManager.default.fileExists(atPath: file.path),
            try file.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true else { return }
      try FileManager.default.removeItem(at: file)
    }.runOnQueue(queue)

    // Probe the same output combination without starting another capture session.
    AsyncFunction("formats") { (deviceID: String) -> [String] in
      guard let device = AVCaptureDevice(uniqueID: deviceID) else { return ["jpeg"] }
      let session = AVCaptureSession()
      let input = try AVCaptureDeviceInput(device: device)
      let output = AVCapturePhotoOutput()
      let frames = AVCaptureVideoDataOutput()
      session.beginConfiguration()
      if session.canSetSessionPreset(.photo) { session.sessionPreset = .photo }
      guard session.canAddInput(input) else { session.commitConfiguration(); return ["jpeg"] }
      session.addInput(input)
      guard session.canAddOutput(output) else { session.commitConfiguration(); return ["jpeg"] }
      session.addOutput(output)
      guard session.canAddOutput(frames) else { session.commitConfiguration(); return ["jpeg"] }
      session.addOutput(frames)
      session.commitConfiguration()
      var formats = ["jpeg"]
      if output.availablePhotoCodecTypes.contains(.hevc) { formats.insert("heic", at: 0) }
      if !output.availableRawPhotoPixelFormatTypes.isEmpty { formats.append("dng") }
      return formats
    }.runOnQueue(queue)

    AsyncFunction("render") { (source: String, matrix: [Double], format: String, recipe: String) -> [String: Any] in
      guard matrix.count == 20, matrix.allSatisfy({ $0.isFinite }), ["jpeg", "heic"].contains(format),
            let sourceURL = URL(string: source), sourceURL.isFileURL,
            let imageSource = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
            let original = CIImage(contentsOf: sourceURL, options: [.applyOrientationProperty: true, .colorSpace: self.colorSpace]) else {
        throw NSError(domain: "Iris", code: 1, userInfo: [NSLocalizedDescriptionKey: "The original photo could not be read."])
      }
      let result = original.applyingFilter("CIColorMatrix", parameters: [
        "inputRVector": CIVector(x: matrix[0], y: matrix[1], z: matrix[2], w: matrix[3]),
        "inputGVector": CIVector(x: matrix[5], y: matrix[6], z: matrix[7], w: matrix[8]),
        "inputBVector": CIVector(x: matrix[10], y: matrix[11], z: matrix[12], w: matrix[13]),
        "inputAVector": CIVector(x: matrix[15], y: matrix[16], z: matrix[17], w: matrix[18]),
        "inputBiasVector": CIVector(x: matrix[4], y: matrix[9], z: matrix[14], w: matrix[19])
      ])
      guard let cgImage = self.context.createCGImage(result, from: result.extent, format: .RGBA8, colorSpace: self.colorSpace) else {
        throw NSError(domain: "Iris", code: 2, userInfo: [NSLocalizedDescriptionKey: "Photo processing ran out of resources. The original is retained."])
      }
      let destinationURL = FileManager.default.temporaryDirectory.appendingPathComponent("iris-\(UUID().uuidString).\(format == "jpeg" ? "jpg" : "heic")")
      let type = format == "heic" ? UTType.heic.identifier : UTType.jpeg.identifier
      guard let destination = CGImageDestinationCreateWithURL(destinationURL as CFURL, type as CFString, 1, nil) else {
        throw NSError(domain: "Iris", code: 3, userInfo: [NSLocalizedDescriptionKey: "This device cannot encode the selected format. Choose JPEG."])
      }
      var properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [String: Any] ?? [:]
      properties[kCGImagePropertyOrientation as String] = 1
      properties[kCGImagePropertyPixelWidth as String] = cgImage.width
      properties[kCGImagePropertyPixelHeight as String] = cgImage.height
      properties[kCGImageDestinationLossyCompressionQuality as String] = 0.95
      var exif = properties[kCGImagePropertyExifDictionary as String] as? [String: Any] ?? [:]
      exif[kCGImagePropertyExifUserComment as String] = recipe
      exif[kCGImagePropertyExifPixelXDimension as String] = cgImage.width
      exif[kCGImagePropertyExifPixelYDimension as String] = cgImage.height
      properties[kCGImagePropertyExifDictionary as String] = exif
      CGImageDestinationAddImage(destination, cgImage, properties as CFDictionary)
      guard CGImageDestinationFinalize(destination) else {
        try? FileManager.default.removeItem(at: destinationURL)
        throw NSError(domain: "Iris", code: 4, userInfo: [NSLocalizedDescriptionKey: "The processed photo could not be written. Free up storage and retry."])
      }
      return ["uri": destinationURL.absoluteString, "width": cgImage.width, "height": cgImage.height]
    }.runOnQueue(queue)
  }
}
