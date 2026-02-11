using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAircraftMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AircraftImportStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    LastImportedUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SourcePath = table.Column<string>(type: "TEXT", maxLength: 260, nullable: true),
                    SourceLastWriteUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ImportedRows = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftImportStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AircraftMetadata",
                columns: table => new
                {
                    Icao24 = table.Column<string>(type: "TEXT", maxLength: 6, nullable: false),
                    Timestamp = table.Column<long>(type: "INTEGER", nullable: false),
                    TypeCode = table.Column<string>(type: "TEXT", maxLength: 16, nullable: true),
                    ManufacturerName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Model = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Registration = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    OperatorIcao = table.Column<string>(type: "TEXT", maxLength: 16, nullable: true),
                    OperatorName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Country = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    CategoryDescription = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    UpdatedUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftMetadata", x => x.Icao24);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AircraftMetadata_TypeCode",
                table: "AircraftMetadata",
                column: "TypeCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AircraftImportStates");

            migrationBuilder.DropTable(
                name: "AircraftMetadata");
        }
    }
}
