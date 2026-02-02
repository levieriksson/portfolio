using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace FlightTracker.Backend.Services;

public class OpenSkyAuthService
{
    private readonly string _clientId;
    private readonly string _clientSecret;
    private string? _accessToken;
    private DateTime _expiryUtc = DateTime.MinValue;
    private readonly HttpClient _httpClient;

    public OpenSkyAuthService(string clientId, string clientSecret)
    {
        _clientId = clientId;
        _clientSecret = clientSecret;
        _httpClient = new HttpClient();
    }

    public async Task<string> GetAccessTokenAsync()
    {
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _expiryUtc)
            return _accessToken!;

        try
        {
            var form = new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "client_id", _clientId },
                { "client_secret", _clientSecret }
            };

            var request = new HttpRequestMessage(HttpMethod.Post,
                "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token")
            {
                Content = new FormUrlEncodedContent(form)
            };

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            _accessToken = json.GetProperty("access_token").GetString();
            var expiresIn = json.GetProperty("expires_in").GetInt32();
            _expiryUtc = DateTime.UtcNow.AddSeconds(expiresIn - 30);

            Console.WriteLine($"[Auth] Got token, expires in {expiresIn}s");
            return _accessToken!;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Auth] Failed to get Bearer token: {ex.Message}");
            throw;
        }
    }

    public async Task<HttpClient> GetAuthorizedClientAsync()
    {
        var token = await GetAccessTokenAsync();
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return _httpClient;
    }
}
