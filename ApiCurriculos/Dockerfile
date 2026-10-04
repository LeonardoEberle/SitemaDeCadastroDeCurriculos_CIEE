# ============================================================
# Stage 1: SDK - Build e publicacao da aplicacao
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia apenas o csproj primeiro para aproveitar cache do Docker
COPY ["ApiCurriculos/ApiCurriculos.csproj", "ApiCurriculos/"]
RUN dotnet restore "ApiCurriculos/ApiCurriculos.csproj"

# Copia todo o restante do fonte e builda
COPY . .
WORKDIR "/src/ApiCurriculos"
RUN dotnet build "ApiCurriculos.csproj" -c Release -o /app/build

# Publica em modo Release para a pasta de saida
FROM build AS publish
RUN dotnet publish "ApiCurriculos.csproj" -c Release -o /app/publish \
    /p:UseAppHost=false

# ============================================================
# Stage 2: Runtime - Apenas o necessario para rodar
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_PRINT_TELEMETRY_MESSAGE=false

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "ApiCurriculos.dll"]
