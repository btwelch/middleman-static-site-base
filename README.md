Base is a starter-site for building Middleman-based web pages. It is pre-configured to be deployed to Amazon S3 for static hosting. It's tricked-out with all the niceties that make for an optimized site, plus some extras I threw in to make content-generation the focal-point of your time. Here's what is in store:

* Dynamic navigation at the folder-level. 
* Baked-in sitemap for SEO. 
* Metadata controls

---
changefreq: "weekly"
priority: 1.0
menu_title: "Home"
sitemap_exclude: false
---

changefreq - Added to the sitemap as the change frequency for the page. Recommend 'weekly' or 'monthly' unless your pages are updated all the time.

priority - Added to the sitemap. A hint to Google to tell it which pages are the most important to you assuming Google will only index so much of your site.

menu_title - Allows you to specify what your anchor text is going to be in your navigational/menu links.

sitemap_exclude - Some content isn't ready for prime-time. Set this to false if you don't want under-construction pages to appear either in the sitemap or in your navigation/menus.


Thanks for reading... and enjoy!