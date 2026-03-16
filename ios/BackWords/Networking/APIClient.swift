import Foundation

// MARK: - ExplainSourceResponse (network model)

struct ExplainSourceResponse: Codable {
    let sourceId: String
    let explanation: String
    let supportingQuotes: [String]
    let confidenceNarrative: String
    let generatedAt: String
}

// MARK: - Request bodies

struct InterpretRequest: Codable {
    let query: String
    let mode: String
    let selectedDate: String?
}

struct ExplainSourceRequest: Codable {
    let sourceId: String
    let query: String
    let snapshotId: String
}

// MARK: - APIClient protocol

protocol APIClient: Sendable {
    func interpret(request: InterpretRequest) async throws -> InterpretationResult
    func explainSource(request: ExplainSourceRequest) async throws -> ExplainSourceResponse
}

// MARK: - APIError

enum APIError: LocalizedError {
    case invalidURL
    case networkError(Error)
    case httpError(Int)
    case decodingError(Error)
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid server URL. Check Settings."
        case .networkError(let e): return "Network error: \(e.localizedDescription)"
        case .httpError(let code): return "Server returned HTTP \(code)."
        case .decodingError: return "Could not parse the server response."
        case .serverError(let msg): return msg
        }
    }
}

// MARK: - LiveAPIClient

final class LiveAPIClient: APIClient {
    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder

    init(baseURL: String, session: URLSession = .shared) {
        self.baseURL = baseURL.trimmingCharacters(in: .init(charactersIn: "/"))
        self.session = session
        self.decoder = JSONDecoder()
    }

    func interpret(request: InterpretRequest) async throws -> InterpretationResult {
        try await post(path: "/interpret", body: request)
    }

    func explainSource(request: ExplainSourceRequest) async throws -> ExplainSourceResponse {
        try await post(path: "/explain-source", body: request)
    }

    // MARK: Private

    private func post<Body: Encodable, Response: Decodable>(
        path: String,
        body: Body
    ) async throws -> Response {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(body)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw APIError.networkError(error)
        }

        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw APIError.httpError(http.statusCode)
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
}

// MARK: - MockAPIClient

final class MockAPIClient: APIClient {
    func interpret(request: InterpretRequest) async throws -> InterpretationResult {
        // Simulate network latency for realistic preview behaviour.
        try await Task.sleep(for: .milliseconds(300))
        return PreviewData.interpretationResult
    }

    func explainSource(request: ExplainSourceRequest) async throws -> ExplainSourceResponse {
        try await Task.sleep(for: .milliseconds(200))
        return ExplainSourceResponse(
            sourceId: request.sourceId,
            explanation: "This source supports the interpretation because it provides documented evidence of the word's historical usage at this period. The excerpt is drawn directly from the original text and cross-referenced with other contemporary sources.",
            supportingQuotes: [],
            confidenceNarrative: "High confidence — primary scholarly authority with documented quotations.",
            generatedAt: ISO8601DateFormatter().string(from: Date())
        )
    }
}
