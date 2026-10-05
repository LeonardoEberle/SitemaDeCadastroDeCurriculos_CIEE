using ApiCurriculos.Data;
using ApiCurriculos.Services;
using Microsoft.EntityFrameworkCore;

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
                  .AllowAnyMethod();
        });
});

var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["CONNECTION_STRING"]
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"]
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(defaultConnection, o => o.CommandTimeout(60)));

builder.Services.AddScoped<IPdfExtractorService, PdfExtractorService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();

_ = Task.Run(async () =>
{
    using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(3));
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            var created = await db.Database.EnsureCreatedAsync(cts.Token);
            app.Logger.LogInformation(created
                ? "Banco de dados e tabelas criados com sucesso via EnsureCreated."
                : "Banco de dados já existia (EnsureCreated retornou false).");
        }
        catch (Exception exEnsure)
        {
            app.Logger.LogError(exEnsure, "EnsureCreatedAsync falhou. Verifique a connection string e permissões do SQL Server.");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Erro ao inicializar banco de dados em background.");
    }
});

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
