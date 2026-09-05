Pod::Spec.new do |s|
  s.name = 'IrisProcessing'
  s.version = '1.0.0'
  s.summary = 'Local color processing and camera format discovery for Iris'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Iris contributors'
  s.homepage = 'https://github.com/MohtashamMurshid/iris'
  s.platforms = { :ios => '16.4' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'CoreImage', 'ImageIO', 'UniformTypeIdentifiers'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.swift_version = '5.9'
end
