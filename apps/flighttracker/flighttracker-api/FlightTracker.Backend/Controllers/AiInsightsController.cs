using FlightTracker.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace FlightTracker.Backend.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AiInsightsController(AiTrafficBriefService aiTrafficBriefService) : ControllerBase
{
    [HttpPost("traffic-brief")]
    public async Task<IActionResult> GenerateTrafficBrief(CancellationToken cancellationToken)
    {
        var brief = await aiTrafficBriefService.GenerateAsync(cancellationToken);
        return Ok(brief);
    }
}