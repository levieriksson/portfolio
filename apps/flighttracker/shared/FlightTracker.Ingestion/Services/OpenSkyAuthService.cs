using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FlightTracker.Ingestion.Options;

namespace FlightTracker.Ingestion.Services;


public sealed class OpenSkyAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenSkyOptions _options;
    private readonly ILogger<OpenSkyAuthService> _logger;

    private readonly SemaphoreSlim _lock = new(1, 1);
    private string? _accessToken;
    private DateTime _expiryUtc = DateTime.MinValue;

    public OpenSkyAuthService(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenSkyOptions> options,
        ILogger<OpenSkyAuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _expiryUtc)
            return _accessToken!;

        await _lock.WaitAsync(ct);
        try
        {
            if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _expiryUtc)
                return _accessToken!;

            var client = _httpClientFactory.CreateClient("opensky");

            var form = new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "client_id", _options.Username },
                { "client_secret", _options.Password }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl)
            {
                Content = new FormUrlEncodedContent(form)
            };

            using var response = await client.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            _accessToken = json.GetProperty("access_token").GetString();

            var expiresIn = json.GetProperty("expires_in").GetInt32();
            _expiryUtc = DateTime.UtcNow.AddSeconds(Math.Max(30, expiresIn - 30));

            _logger.LogInformation("OpenSky token acquired. Expires in {Seconds}s.", expiresIn);
            return _accessToken!;
        }
        finally
        {
            _lock.Release();
        }
    }
}
