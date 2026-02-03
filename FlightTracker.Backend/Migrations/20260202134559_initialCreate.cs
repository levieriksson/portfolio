using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Backend.Migrations
{
    /// <inheritdoc />
    public partial class initialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    TimestampUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftSnapshots", x => x.Id);
                });

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
                    MaxAltitude = table.Column<double>(type: "REAL", nullable: true),
                    AvgAltitude = table.Column<double>(type: "REAL", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightSessions", x => x.Id);
                });
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
