source "https://rubygems.org"

ruby file: ".ruby-version"

# Jekyll 4.x direkt (kein github-pages-Gem mehr): Der Deploy läuft über einen eigenen
# GitHub-Actions-Build, daher gilt die Pages-Plugin-Whitelist nicht und wir bekommen die
# aktuelle Jekyll-Version inkl. dart-sass (jekyll-sass-converter 3.x).
gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-include-cache"
  gem "jekyll-paginate-v2"
  gem "jekyll-sitemap"
  gem "jekyll-gist"
  gem "jekyll-feed"
  gem "jekyll-last-modified-at"
  gem "jekyll-remote-theme" # für remote_theme nötig (kam vorher implizit über github-pages)
end

gem "webrick", "~> 1.7"  # ab Ruby 3 nicht mehr in der stdlib
gem "faraday-retry"      # Retries für octokit/jekyll-gist
