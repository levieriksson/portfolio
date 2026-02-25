using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Data.Migrations
{
    public partial class AddFlightSessionAirborneTickCount : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AirborneTickCount",
                table: "FlightSessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AirborneTickCount",
                table: "FlightSessions");
        }
    }
}