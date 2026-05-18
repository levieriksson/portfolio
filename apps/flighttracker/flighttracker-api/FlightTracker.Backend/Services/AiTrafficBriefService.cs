using FlightTracker.Backend.DTO;

namespace FlightTracker.Backend.Services;

public sealed class AiTrafficBriefService
{
    public Task<AiTrafficBriefResponseDto> GenerateAsync(CancellationToken cancellationToken)
    {
        var response = new AiTrafficBriefResponseDto
        {
            Headline = "Traffic activity is steady today",
            Bullets =
            [
                "Observed sessions are close to the previous period.",
                "Peak activity appears during the afternoon.",
                "Top airline data is available for the current window."
            ],
            Confidence = "medium",
            Caveats =
            [
                "This is a placeholder response until AI integration is enabled."
            ],
            GeneratedAtUtc = DateTime.UtcNow
        };

        return Task.FromResult(response);
    }
}