using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAirborneSnapshotCountToFlightSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AirborneSnapshotCount",
                table: "FlightSessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AirborneSnapshotCount",
                table: "FlightSessions");
        }
    }
}
