using System.Linq;
using System.Threading.Tasks;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class DebugController : ControllerBase
    {
        private readonly FlightDbContext _db;

        public DebugController(FlightDbContext db)
        {
            _db = db;
        }


        [HttpGet("ingestion")]
        public async Task<IActionResult> GetIngestion()
        {
            var lastSnap = await _db.AircraftSnapshots
                .OrderByDescending(s => s.TimestampUtc)
                .Select(s => s.TimestampUtc)
                .FirstOrDefaultAsync();

            var snapCount = await _db.AircraftSnapshots.CountAsync();
            var sessionCount = await _db.FlightSessions.CountAsync();

            return Ok(new
            {
                lastSnapshotUtc = lastSnap,
                snapshots = snapCount,
                sessions = sessionCount
            });
        }


        [HttpGet("aircraft-import")]
        public async Task<IActionResult> GetAircraftImport()
        {
            var aircraftRows = await _db.AircraftMetadata.CountAsync();
            var state = await _db.AircraftImportStates
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == 1);

            return Ok(new
            {
                aircraftRows,
                state
            });
        }
    }
}
