import SwiftUI

struct HomeSearchView: View {
    @EnvironmentObject private var container: AppContainer
    @StateObject private var vm: HomeViewModel
    @State private var navigationResult: InterpretationResult? = nil

    init() {
        // Placeholder; real init happens in onAppear via container.
        _vm = StateObject(wrappedValue: HomeViewModel(
            apiClient: MockAPIClient(),
            localStore: LocalStore()
        ))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                // MARK: Search field
                VStack(spacing: Spacing.sm) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(Color.secondary)
                        TextField("Enter a word or phrase…", text: $vm.searchText)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onSubmit { vm.search() }
                        if !vm.searchText.isEmpty {
                            Button { vm.searchText = "" } label: {
                                Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(Spacing.md)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    // Mode picker
                    Picker("Mode", selection: $vm.selectedMode) {
                        ForEach(SearchMode.allCases) { mode in
                            Label(mode.displayName, systemImage: mode.systemImage).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)

                    // Date toggle
                    Button {
                        withAnimation { vm.isDatePickerVisible.toggle() }
                    } label: {
                        Label(
                            vm.selectedDate.map { "Era: \(yearString($0))" } ?? "Pick an era",
                            systemImage: "calendar"
                        )
                        .font(.footnote)
                    }

                    if vm.isDatePickerVisible {
                        DatePicker(
                            "Select year",
                            selection: Binding(
                                get: { vm.selectedDate ?? Date() },
                                set: { vm.selectedDate = $0 }
                            ),
                            in: Date(timeIntervalSince1970: -18_000_000_000)...Date(),
                            displayedComponents: .date
                        )
                        .datePickerStyle(.graphical)
                    }

                    Button {
                        vm.search()
                    } label: {
                        Group {
                            if vm.isLoading {
                                ProgressView()
                            } else {
                                Text("Search")
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(vm.searchText.trimmingCharacters(in: .whitespaces).isEmpty || vm.isLoading)
                }

                if let error = vm.error {
                    Text(error).foregroundStyle(.red).font(.footnote)
                }

                // MARK: Examples
                Text("Explore").font(.headline)
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 140))], spacing: Spacing.sm) {
                    ForEach(vm.examples) { ex in
                        Button {
                            vm.search(query: ex.text, mode: ex.mode)
                        } label: {
                            VStack(alignment: .leading, spacing: Spacing.xs) {
                                Text(ex.text).font(.headline).foregroundStyle(.primary)
                                Text(ex.eraHint).font(.caption).foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(Spacing.md)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                    }
                }

                // MARK: Recent searches
                if !vm.recentSearches.isEmpty {
                    HStack {
                        Text("Recent").font(.headline)
                        Spacer()
                        Button("Clear", role: .destructive) { vm.clearHistory() }
                            .font(.footnote)
                    }
                    ForEach(vm.recentSearches.prefix(5)) { item in
                        Button {
                            vm.search(query: item.text, mode: item.mode)
                        } label: {
                            HStack {
                                Image(systemName: "clock.arrow.circlepath").foregroundStyle(.secondary)
                                Text(item.text).foregroundStyle(.primary)
                                Spacer()
                                Text(item.mode.displayName).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(Spacing.lg)
        }
        .navigationTitle("BackWords")
        .onAppear {
            vm.loadRecentSearches()
        }
        .navigationDestination(item: $navigationResult) { result in
            ResultCompareView(result: result)
        }
        .onReceive(NotificationCenter.default.publisher(for: .init("BackWords.ResultLoaded"))) { note in
            if let result = note.object as? InterpretationResult {
                navigationResult = result
            }
        }
    }

    private func yearString(_ date: Date) -> String {
        let cal = Calendar.current
        return "\(cal.component(.year, from: date))"
    }
}

#Preview {
    NavigationStack {
        HomeSearchView()
    }
    .environmentObject(AppContainer())
}
