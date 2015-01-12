module CustomHelpers

  #################################################################
  ## Custom page/data generators for recurring events/seminars   ##
  #################################################################

  cattr_accessor :EVENT_TYPE_SEO_SEMINAR,
                 :EVENT_TYPE_GOOGLE_ADS_SEMINAR,
                 :EVENT_TYPE_WEB_MARKETING_SEMINAR,
                 :EVENT_TYPE_WEBSITE_SEMINAR

  CustomHelpers.EVENT_TYPE_SEO_SEMINAR = "EVENT_TYPE_SEO_SEMINAR"
  CustomHelpers.EVENT_TYPE_GOOGLE_ADS_SEMINAR = "EVENT_TYPE_GOOGLE_ADS_SEMINAR"
  CustomHelpers.EVENT_TYPE_WEB_MARKETING_SEMINAR = "EVENT_TYPE_WEB_MARKETING_SEMINAR"
  CustomHelpers.EVENT_TYPE_WEBSITE_SEMINAR = "EVENT_TYPE_WEBSITE_SEMINAR"
	
  def get_upcoming_event_details_for_type(event_type)
  	event = Hash.new

  	if event_type == CustomHelpers.EVENT_TYPE_SEO_SEMINAR
      event[:class_availability_months] = [1, 5, 9] # Jan, May, Sept 
  	  event[:class_hour_of_day] = 11
      event[:class_duration_minutes] = 120
      event[:class_name] = "Seminar: Beginning SEO"
      event[:class_description] = ""
      event[:class_url] = "/seminars/seo-seminar.html"
      event[:class_purchase_url] = "GUMROAD_PURCHASE_URL"
      event[:class_location] = { :city => "City",
                                :state => "State",
                                :name => "TBD",
                                :url => "TBD" }
      event[:ticket] = {
        :low_price => 35,
        :remaining_spaces => 21
      }

    elsif event_type == CustomHelpers.EVENT_TYPE_GOOGLE_ADS_SEMINAR
      event[:class_availability_months] = [2, 6, 10] # Feb Jun Oct 
      event[:class_hour_of_day] = 11
      event[:class_duration_minutes] = 120
      event[:class_name] = "Seminar: DIY Google Ads"
      event[:class_description] = ""
      event[:class_url] = "/seminars/google-ads-seminar.html"
      event[:class_purchase_url] = "GUMROAD_PURCHASE_URL"
      event[:class_location] = { :city => "City",
                                :state => "State",
                                :name => "TBD",
                                :url => "TBD" }
      event[:ticket] = {
        :low_price => 35,
        :remaining_spaces => 17
      }

  	elsif event_type == CustomHelpers.EVENT_TYPE_WEB_MARKETING_SEMINAR
      event[:class_availability_months] = [3, 11] # Mar, Jul, Nov
      event[:class_hour_of_day] = 11
      event[:class_duration_minutes] = 120
      event[:class_name] = "Seminar: Internet Marketing Basics"
      event[:class_description] = ""
      event[:class_url] = "/seminars/web-marketing-seminar.html"
      event[:class_purchase_url] = "GUMROAD_PURCHASE_URL"
      event[:class_location] = { :city => "City",
                                :state => "State",
                                :name => "TBD",
                                :url => "TBD" }
      event[:ticket] = {
        :low_price => 35,
        :remaining_spaces => 23
      }

  	elsif event_type == CustomHelpers.EVENT_TYPE_WEBSITE_SEMINAR
      event[:class_availability_months] = [4, 8, 12] # Apr Aug Dec 
      event[:class_hour_of_day] = 11
      event[:class_duration_minutes] = 120
      event[:class_name] = "Seminar: Creating Websites that Sell"
      event[:class_description] = ""
      event[:class_url] = "/seminars/website-seminar.html"
      event[:class_purchase_url] = "https://gum.co/wTrDH"
      event[:class_location] = { :city => "City",
                                :state => "State",
                                :name => "TBD",
                                :url => "TBD" }

      event[:ticket] = {
        :low_price => 35,
        :remaining_spaces => 13
      }

    end

    next_class_date = nil   
    today = Date.today

    0.upto(event[:class_availability_months].size-1) do |indx|
      availability_month = event[:class_availability_months][indx]

      puts "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
      puts availability_month
      puts today
      puts first_friday_for_month_year(today.year, availability_month)

      if today < first_friday_for_month_year(today.year, availability_month)
        next_class_date = first_friday_for_month_year(today.year, availability_month)
        puts "winner #{next_class_date}"
        break
      end 
      puts "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"

    end
    #if !next_class_date && today < first_friday_for_month_year(today.year+1, event[:class_availability_months][0])
    #  next_class_date = first_friday_for_month_year(today.year+1, event[:class_availability_months][0])
    #end
    event[:start_date] = next_class_date

    return event
  end

  def first_friday_for_month_year(year, month)
    dt = nil
    1.upto(7) do |day|
      dt = Date.new(year, month, day)
      if dt.wday == 5
        break
      end
    end

    return dt
  end


  #################################################################
  ## Rendering nav menus based on individual file metadata       ##
  ##  Basically every file that declares sitemap_exclude         ##
  ##  is not included in the nav menu, else they are included.   ##
  ##  A really nice way to update menus just by adding/removing  ##
  ##  and manipulating page files.                               ##
  #################################################################

  def render_nav_menu_options(starting_dir, html)    
    files = Dir.entries(starting_dir).select { |p| p.match(/.html.erb$/) }
    files.each do |f|
        if !f.start_with?("_")
          page = sitemap.resources.find_all{|p| p.source_file.include?(f) }.first
          if !page
            raise f
          end

          if !page.data.sitemap_exclude
            html << "<li class=''><a href='/#{starting_dir.gsub("source/", "")}/#{f.gsub(".erb", "")}' title='' tooltip=''>#{page && page.data.menu_title ? page.data.menu_title : f}</a></li>"
          end
        end
    end

    return html
  end
end
