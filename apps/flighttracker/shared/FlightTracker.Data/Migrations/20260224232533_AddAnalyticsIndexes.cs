using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_FlightSessions_FirstSeenUtc",
                table: "FlightSessions",
                column: "FirstSeenUtc");

            migrationBuilder.CreateIndex(
                name: "IX_FlightSessions_IsActive_LastSeenUtc",
                table: "FlightSessions",
                columns: new[] { "IsActive", "LastSeenUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_FlightSessions_LastSnapshotUtc",
                table: "FlightSessions",
                column: "LastSnapshotUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AircraftSnapshots_FlightSessionId_TimestampUtc",
                table: "AircraftSnapshots",
                columns: new[] { "FlightSessionId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AircraftSnapshots_TimestampUtc",
                table: "AircraftSnapshots",
                column: "TimestampUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FlightSessions_FirstSeenUtc",
                table: "FlightSessions");

            migrationBuilder.DropIndex(
                name: "IX_FlightSessions_IsActive_LastSeenUtc",
                table: "FlightSessions");

            migrationBuilder.DropIndex(
                name: "IX_FlightSessions_LastSnapshotUtc",
                table: "FlightSessions");

            migrationBuilder.DropIndex(
                name: "IX_AircraftSnapshots_FlightSessionId_TimestampUtc",
                table: "AircraftSnapshots");

            migrationBuilder.DropIndex(
                name: "IX_AircraftSnapshots_TimestampUtc",
                table: "AircraftSnapshots");
        }
    }
}
