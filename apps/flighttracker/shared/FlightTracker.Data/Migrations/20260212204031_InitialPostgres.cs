using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FlightTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AircraftImportStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LastImportedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SourcePath = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: true),
                    SourceLastWriteUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportedRows = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftImportStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AircraftMetadata",
                columns: table => new
                {
                    Icao24 = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    Timestamp = table.Column<long>(type: "bigint", nullable: false),
                    TypeCode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ManufacturerName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Model = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Registration = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    OperatorIcao = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    OperatorName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Country = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CategoryDescription = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftMetadata", x => x.Icao24);
                });

            migrationBuilder.CreateTable(
                name: "FlightSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Icao24 = table.Column<string>(type: "text", nullable: false),
                    Callsign = table.Column<string>(type: "text", nullable: true),
                    FirstSeenUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    EndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CloseReason = table.Column<string>(type: "text", nullable: true),
                    SnapshotCount = table.Column<int>(type: "integer", nullable: false),
                    MaxAltitude = table.Column<double>(type: "double precision", nullable: true),
                    AvgAltitude = table.Column<double>(type: "double precision", nullable: true),
                    EnteredSwedenUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExitedSwedenUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLatitude = table.Column<double>(type: "double precision", nullable: true),
                    LastLongitude = table.Column<double>(type: "double precision", nullable: true),
                    LastAltitude = table.Column<double>(type: "double precision", nullable: true),
                    LastVelocity = table.Column<double>(type: "double precision", nullable: true),
                    LastTrueTrack = table.Column<double>(type: "double precision", nullable: true),
                    LastSnapshotUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastInSweden = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AircraftSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Icao24 = table.Column<string>(type: "text", nullable: false),
                    Callsign = table.Column<string>(type: "text", nullable: true),
                    OriginCountry = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Altitude = table.Column<double>(type: "double precision", nullable: true),
                    Velocity = table.Column<double>(type: "double precision", nullable: true),
                    TrueTrack = table.Column<double>(type: "double precision", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FlightSessionId = table.Column<int>(type: "integer", nullable: true),
                    InSweden = table.Column<bool>(type: "boolean", nullable: false)
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
                name: "IX_AircraftMetadata_TypeCode",
                table: "AircraftMetadata",
                column: "TypeCode");

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
                name: "AircraftImportStates");

            migrationBuilder.DropTable(
                name: "AircraftMetadata");

            migrationBuilder.DropTable(
                name: "AircraftSnapshots");

            migrationBuilder.DropTable(
                name: "FlightSessions");
        }
    }
}
