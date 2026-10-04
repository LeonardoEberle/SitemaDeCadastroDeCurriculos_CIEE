var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

var corsOrigin = builder.Configuration["CORS__Origin"]
    ?? builder.Configuration.GetValue<string>("Cors:Origin")
    ?? "http://localhost:8080";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowFrontend",
        policy =>
        {
            policy.WithOrigins(corsOrigin)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["CONNECTION_STRING"]
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"];

if (!string.IsNullOrEmpty(defaultConnection))
{
    builder.Services.Configure<DatabaseSettings>(options =>
    {
        options.DefaultConnection = defaultConnection;
    });
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();

public sealed class DatabaseSettings
{
    public string DefaultConnection { get; set; } = string.Empty;
}
