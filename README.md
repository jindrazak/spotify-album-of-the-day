# Spotify Album of the Day

[![Google Cloud Run](https://github.com/jindrazak/spotify-album-of-the-day/actions/workflows/gcp-cloud-run.yaml/badge.svg?branch=gcp-cloud-run)](https://github.com/jindrazak/spotify-album-of-the-day/actions/workflows/gcp-cloud-run.yaml)

A simple web app that picks a random album based on your previous listening tastes on Spotify. 

Deploys to Google Cloud Run:
https://spotify-album-of-the-day-6r4ar544wa-lm.a.run.app/

# Secrets

In order to make the communication with Spotify API work, you need to provide these secrets to the Docker container:

* SPOTIFY_CLIENT_ID 
* SPOTIFY_CLIENT_SECRET
* SPOTIFY_REDIRECT_URI
