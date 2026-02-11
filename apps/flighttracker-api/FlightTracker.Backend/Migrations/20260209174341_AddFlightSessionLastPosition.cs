using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTracker.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightSessionLastPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "LastAltitude",
                table: "FlightSessions",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LastInSweden",
                table: "FlightSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "LastLatitude",
                table: "FlightSessions",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LastLongitude",
                table: "FlightSessions",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSnapshotUtc",
                table: "FlightSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LastVelocity",
                table: "FlightSessions",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastAltitude",
                table: "FlightSessions");

            migrationBuilder.DropColumn(
                name: "LastInSweden",
                table: "FlightSessions");

            migrationBuilder.DropColumn(
                name: "LastLatitude",
                table: "FlightSessions");

            migrationBuilder.DropColumn(
                name: "LastLongitude",
                table: "FlightSessions");

            migrationBuilder.DropColumn(
                name: "LastSnapshotUtc",
                table: "FlightSessions");

            migrationBuilder.DropColumn(
                name: "LastVelocity",
                table: "FlightSessions");
        }
    }
}
