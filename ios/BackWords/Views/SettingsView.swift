import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var container: AppContainer
    @StateObject private var vm: SettingsViewModel

    init() {
        // Placeholder; replaced in body via container.
        _vm = StateObject(wrappedValue: SettingsViewModel(container: AppContainer()))
    }

    var body: some View {
        Form {
            Section("Proxy") {
                TextField("Base URL", text: $vm.proxyBaseURL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Toggle("Mock Mode (no network)", isOn: $vm.mockMode)
            }

            Section("Results") {
                Stepper("Max sources: \(vm.maxSources)", value: $vm.maxSources, in: 1...10)
                Picker("Cache Policy", selection: $vm.cachePolicy) {
                    ForEach(CachePolicy.allCases) { p in Text(p.displayName).tag(p) }
                }
            }

            Section("Appearance") {
                Picker("Theme", selection: $vm.appearance) {
                    ForEach(AppearanceMode.allCases) { m in Text(m.displayName).tag(m) }
                }
                .pickerStyle(.segmented)
            }

            Section("Data") {
                Button(role: .destructive) { vm.clearHistory() } label: {
                    Label("Clear Search History", systemImage: "trash")
                }
                Button { vm.clearCache() } label: {
                    Label("Clear Cache", systemImage: "arrow.clockwise")
                }
            }

            Section("Privacy") {
                Toggle("Anonymous Telemetry", isOn: $vm.telemetryEnabled)
                Text("BackWords does not transmit personal data. Telemetry, if enabled, sends only anonymous query counts.")
                    .font(.footnote).foregroundStyle(.secondary)
            }

            Section {
                Button {
                    vm.save()
                } label: {
                    HStack {
                        Text(vm.isSaved ? "Saved ✓" : "Save Settings")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(vm.isSaved)
            }
        }
        .navigationTitle("Settings")
    }
}

#Preview {
    NavigationStack { SettingsView() }.environmentObject(AppContainer())
}
