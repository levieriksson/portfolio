using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOnGroundToAircraftSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "OnGround",
                table: "AircraftSnapshots",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OnGround",
                table: "AircraftSnapshots");
        }
    }
}
