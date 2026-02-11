using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTrueTrack : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "LastTrueTrack",
                table: "FlightSessions",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TrueTrack",
                table: "AircraftSnapshots",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastTrueTrack",
                table: "FlightSessions");

            migrationBuilder.DropColumn(
                name: "TrueTrack",
                table: "AircraftSnapshots");
        }
    }
}
