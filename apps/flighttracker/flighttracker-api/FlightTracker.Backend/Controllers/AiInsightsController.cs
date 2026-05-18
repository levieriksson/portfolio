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
        try
        {
            var brief = await aiTrafficBriefService.GenerateAsync(cancellationToken);
            return Ok(brief);
        }
        catch (Exception ex)
        {
            return Problem(
                title: "Failed to generate traffic brief",
                detail: ex.ToString(),
                statusCode: 500);
        }
    }
}