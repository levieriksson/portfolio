using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FlightSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Icao24 = table.Column<string>(type: "TEXT", nullable: false),
                    Callsign = table.Column<string>(type: "TEXT", nullable: true),
                    FirstSeenUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastSeenUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    EndUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CloseReason = table.Column<string>(type: "TEXT", nullable: true),
                    SnapshotCount = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxAltitude = table.Column<double>(type: "REAL", nullable: true),
                    AvgAltitude = table.Column<double>(type: "REAL", nullable: true),
                    EnteredSwedenUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExitedSwedenUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AircraftSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Icao24 = table.Column<string>(type: "TEXT", nullable: false),
                    Callsign = table.Column<string>(type: "TEXT", nullable: true),
                    OriginCountry = table.Column<string>(type: "TEXT", nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: true),
                    Longitude = table.Column<double>(type: "REAL", nullable: true),
                    Altitude = table.Column<double>(type: "REAL", nullable: true),
                    Velocity = table.Column<double>(type: "REAL", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FlightSessionId = table.Column<int>(type: "INTEGER", nullable: true),
                    InSweden = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AircraftSnapshots_FlightSessions_FlightSessionId",
                        column: x => x.FlightSessionId,
                        principalTable: "FlightSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AircraftSnapshots_FlightSessionId",
                table: "AircraftSnapshots",
                column: "FlightSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AircraftSnapshots_Icao24_TimestampUtc",
                table: "AircraftSnapshots",
                columns: new[] { "Icao24", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_FlightSessions_EnteredSwedenUtc",
                table: "FlightSessions",
                column: "EnteredSwedenUtc");

            migrationBuilder.CreateIndex(
                name: "IX_FlightSessions_Icao24_IsActive",
                table: "FlightSessions",
                columns: new[] { "Icao24", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AircraftSnapshots");

            migrationBuilder.DropTable(
                name: "FlightSessions");
        }
    }
}
