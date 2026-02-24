using System;
using System.ComponentModel.DataAnnotations;

namespace FlightTracker.Ingestion.Options;

public sealed class OpenSkyOptions
{
    [Required] public string Username { get; set; } = "";
    [Required] public string Password { get; set; } = "";

    public string TokenUrl { get; set; } =
        "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

    public string StatesUrl { get; set; } =
        "https://opensky-network.org/api/states/all";
}
