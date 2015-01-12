#################################################################
## Directories to ignore for build                             ##
#################################################################

ignore 'someday/'


#################################################################
## Globals                                                     ##
#################################################################

set :your_name, "YOUR NAME"

set :website_name, "My Website Name"
set :website_tag, "A tagline to use on the website, near the logo"
set :website_description, "A plain-English description of what this site is about, including the services you offer, et al."
set :website_keywords, "All, the, keywords, that, are, relevant, to, your, site, don't, overdo, it"

set :website_naked_tld, "YOURSITETLD.com"
set :website_url, "www.YOURSITETLD.com"
set :website_url_with_protocol, "http://www.YOURSITETLD.com/"

set :business_meta_location, "City,State"
set :business_phone, "YOUR-PHN-NMBR"
set :business_email, "your@emailaddress.com"
set :website_locale, "en_US"

set :website_copyright, "&copy; 2015"

set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

##################################################################
## Include rendering helper libs. Useful little functs in here. ##
##################################################################

require "lib/custom_helpers"
helpers CustomHelpers


##################################################################
## Middleman extensions in-use                                  ##
##################################################################

# Build-specific configuration
configure :build do
  # For example, change the Compass output style for deployment
  activate :minify_css

  # Minify Javascript on build
  activate :minify_javascript

  # Enable cache buster
  #activate :asset_hash

  # Use relative URLs
  activate :relative_assets

  # Or use a different image path
  # set :http_prefix, "/Content/images/"

  activate :minify_html

  activate :gzip
end

#activate :livereload
#compass_config do |config|
#  config.output_style = :compressed
#end


##################################################################
## Deploy to Amazon S3 via s3_sync. S3 is my fav static host    ##
##################################################################

activate :s3_sync do |s3_sync|
  s3_sync.bucket                     = 'www.YOURSITETLDASYOURBUCKETNAME.com' # The name of the S3 bucket you are targetting. This is globally unique.
  s3_sync.region                     = 'us-east-1'     # The AWS region for your bucket.
  s3_sync.aws_access_key_id          = 'YOURACCESSKEY'
  s3_sync.aws_secret_access_key      = 'YOURSECRETKEY'
  s3_sync.delete                     = true # We delete stray files by default.
  s3_sync.after_build                = false # We do not chain after the build step by default.
  s3_sync.prefer_gzip                = true
  s3_sync.path_style                 = true
  s3_sync.reduced_redundancy_storage = false
  s3_sync.acl                        = 'public-read'
  s3_sync.encryption                 = true
  s3_sync.prefix                     = nil
  s3_sync.version_bucket             = false
end

##################################################################
## Image compression during build process                       ##
##################################################################

activate :imageoptim do |options|
  # print out skipped images
  options.verbose = false

  # Setting these to true or nil will let options determine them (recommended)
  options.nice = true
  options.threads = true

  # Image extensions to attempt to compress
  options.image_extensions = %w(.png .jpg .gif .svg)

  # compressor worker options, individual optimisers can be disabled by passing
  # false instead of a hash
  options.pngcrush_options  = {:chunks => ['alla'], :fix => false, :brute => false}
  options.pngout_options    = {:copy_chunks => false, :strategy => 0}
  options.optipng_options   = {:level => 6, :interlace => false}
  options.advpng_options    = {:level => 4}
  options.jpegoptim_options = {:strip => ['all'], :max_quality => 100}
  options.jpegtran_options  = {:copy_chunks => false, :progressive => true, :jpegrescan => true}
  options.gifsicle_options  = {:interlace => false}
  #options.svgo_options      = {}
end


##################################################################
## Use different layout files for specific pages                ##
##  If not specified, it will use layout.erb as the defaul      ##
##################################################################

page "/proposals/*", :layout => "some-layout-name"
page "/index.html", :layout => "custom-front-page-layout"
page "/sitemap.xml", :layout => false
#page "/404.html", :layout => false


##################################################################
## Caching policy applied to different file types               ##
##################################################################

#default_caching_policy max_age:(60 * 60 * 24 * 7)
caching_policy 'text/html',              max_age: 0, must_revalidate: true
caching_policy 'text/css',               max_age: (60 * 60 * 24 * 7), must_revalidate: true
caching_policy 'application/javascript', max_age: (60 * 60 * 24 * 7), must_revalidate: true
caching_policy 'image/png',              max_age: (60 * 60 * 24 * 7), must_revalidate: true
caching_policy 'image/gif',              max_age: (60 * 60 * 24 * 7), must_revalidate: true
caching_policy 'image/jpeg',             max_age: (60 * 60 * 24 * 7), must_revalidate: true

#set_default_headers cache_control: {max_age: 31449600, public: true}
#set_headers 'text/html', cache_control: {max_age: 7200, must_revalidate: true}, content_encoding: 'gzip'
#set_headers 'text/css', cache_control: {max_age: 31449600, public: true}, content_encoding: 'gzip'
#set_headers 'application/javascript', cache_control: {max_age: 31449600, public: true}, content_encoding: 'gzip'


##################################################################
## Custom third-party drop-ins                                  ##
##################################################################

set :olark_code, <<eos
  <!-- drop your olark / customer.io / segment.io / boardingparty.io js code in here -->
eos

set :adroll_code, <<eos
  <!-- drop your adroll js code in here -->
eos

set :analytics_code, <<eos
  <!-- drop your analytics js code in here -->
eos


#################################################################
## Other Middleman config stuff I typlically wont use         ##
#################################################################

###
# Compass
###

# Change Compass configuration
# compass_config do |config|
#   config.output_style = :compact
# end

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
# page "/path/to/file.html", :layout => false
#
# With alternative layout
# page "/path/to/file.html", :layout => :otherlayout
#
# A path which all have the same layout
# with_layout :admin do
#   page "/admin/*"
# end

# Proxy pages (http://middlemanapp.com/basics/dynamic-pages/)
# proxy "/this-page-has-no-template.html", "/template-file.html", :locals => {
#  :which_fake_page => "Rendering a fake page with a local variable" }

###
# Helpers
###

# Automatic image dimensions on image_tag helper
# activate :automatic_image_sizes

# Reload the browser automatically whenever files change
# configure :development do
#   activate :livereload
# end

# Methods defined in the helpers block are available in templates
# helpers do
#   def some_helper
#     "Helping"
#   end
# end

