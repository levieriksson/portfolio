using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameLastInSwedenToLastKnownInSweden : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LastInSweden",
                table: "FlightSessions",
                newName: "LastKnownInSweden");

            migrationBuilder.AddColumn<string>(
                name: "InvalidReason",
                table: "AircraftSnapshots",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsValid",
                table: "AircraftSnapshots",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InvalidReason",
                table: "AircraftSnapshots");

            migrationBuilder.DropColumn(
                name: "IsValid",
                table: "AircraftSnapshots");

            migrationBuilder.RenameColumn(
                name: "LastKnownInSweden",
                table: "FlightSessions",
                newName: "LastInSweden");
        }
    }
}
