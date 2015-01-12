Mapper = function() {
	this.jquery = null; //Global jquery object
	this.L = null; //The global mapbox object
	this.geocoder = null; //The global geocoder object
	this.map = null; //The global map object
	this.mapBox = null; //Global mapbox api object
	this.mapKey = 'sthielen.g9j9ce40'; //Our api key
	this.geoData = []; //Listing information
	this.UIListingClickOverride = false;

	this.searchOptions = {
		'school': null,
		'house': true,
		'apartment': true,
		'room': true,
		'rentLower': null,
		'rentUpper': null,
		'bedrooms': null,
		'bathrooms': null,
		'distance': 'driving'
	};

	this.mapPopulated = false;
	this.timer = null;
	this.miniMap = null;
	this.miniMapHouseMarker = null;
	this.currentOpenProperty = 0;

	//Method to initialize the map
	this.initializeMap = function(callback) {
		if(this.map === null) {
			this.geocoder = this.L.mapbox.geocoder(Mapper.mapKey);
			this.map = this.L.mapbox.map(
							'map',
							Mapper.mapKey, 
							{ 
								zoomControl: false,
								keyboard: false,
								tileLayer: {
        							detectRetina: true
    							}
    						}
    					);
			this.mapBox = L.mapbox;
			new this.L.Control.Zoom({ position: 'bottomright' }).addTo(this.map);

			Mapper.map.on('ready', function() {
				//Build custom popup on new map layer
				Mapper.map.markerLayer.on('layeradd', function(e) {
					if(e.layer.feature.properties.type == 'business') {
						Mapper.buildBusinessMarker(e);
					}
					else {
						Mapper.buildPropertyMarker(e);
					}
				});
				//Abstract hover effects between marker layer and left info box
				Mapper.map.markerLayer.on('mouseover', function(e) {
					Mapper.jquery('#preview-' + e.layer.feature.properties.id).css('background-color', 'rgba(208,232,253,0.7)');
				});
				Mapper.map.markerLayer.on('mouseout', function(e) {
					Mapper.jquery('#preview-' + e.layer.feature.properties.id).css('background-color', 'rgba(255,255,255,0.7)');
				});

				Mapper.map.markerLayer.on('popupopen', function(e) {
					if(e.layer.feature.properties.type == 'business') {
						//Track an ad impression
						ga('send', 'event', 'Promotions', 'Map Click Impression', e.layer.feature.properties.business_id);
					}
				})

				if(callback) {
					callback();
				}
			});
		}
		else {
			if(callback) { 
				callback(); 
			}
		}
		return this;
	};

	this.getListings = function(callback) {
		this.jquery
			.getJSON('/index.php?get-listings', this.searchOptions)
			.done(function(returnData) {
				Mapper.geoData = returnData;
				Mapper.buildSchoolFrame();

				// Add features to the map
				if(Mapper.geoData.listings) {
					Mapper.map.markerLayer.setGeoJSON(Mapper.geoData.listings);
				}
				Mapper.buildLeftPreview();
				Mapper.buildNearbyBusinesses();
				Mapper.buildResources();
				Mapper.mapPopulated = true;

				if(callback) {
					callback();
				}
			});

		return true;
	};

	this.positionMiniMap = function(lat,lng,schoolLat,schoolLng) {
		this.mapBox = L.mapbox;
		if(Mapper.miniMap === null) {
			Mapper.miniMap = Mapper.L.mapbox.map(
								'miniMap',
								Mapper.mapKey,
								{
									zoomControl: false,
									tileLayer: {
										detectRetina: true
									}
								}
							);
			Mapper.miniMap.touchZoom.disable();
			Mapper.miniMap.doubleClickZoom.disable();
			Mapper.miniMap.scrollWheelZoom.disable();
		}
		
		if(Mapper.miniMapHouseMarker !== null) {
			Mapper.miniMap.removeLayer(Mapper.miniMapHouseMarker);
		}

		if(!schoolLat || !schoolLng) {
			schoolLat = Mapper.geoData.school.lat;
			schoolLng = Mapper.geoData.school.lng;
		}

		Mapper.miniMap.fitBounds([
			[lat, lng],
			[schoolLat, schoolLng]
		]);

		//Add the property to the map
		Mapper.miniMapHouseMarker = Mapper.mapBox.markerLayer({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [lng, lat]
			},
			properties: {
				'marker-color': '#2947a3'
			}
		}).addTo(Mapper.miniMap);

		//Add the school to the map
		Mapper.mapBox.markerLayer({
			'type': 'Feature',
			'geometry': {
				'type': 'Point',
				'coordinates': [schoolLng, schoolLat]
			},
			'properties': {
				'marker-color': '#990000',
				'marker-symbol': 'college'
			}
		}).addTo(Mapper.miniMap);

		return true;
	}

	this.positionMap = function(lat,lng) {
		Mapper.map.setView([lat, lng], 10);

		Mapper.mapBox.markerLayer({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [lng, lat]
			},
			properties: {
				'marker-color': '#428bca',
				'marker-size': 'large',
				'marker-symbol': 'heart'
			}
		}).addTo(Mapper.map);

		return true;
	};

	this.positionMapByLatLng = function(lat, lng, zoom) {
		Mapper.map.setView([lat, lng], zoom);
		return true;
	};

	this.buildSchoolFrame = function() {
		Mapper.jquery('#schoolName').text(Mapper.geoData.school.name);

		Mapper.map.fitBounds([
			[Mapper.geoData.school.bound_upper_lat, Mapper.geoData.school.bound_upper_lng],
			[Mapper.geoData.school.bound_lower_lat, Mapper.geoData.school.bound_lower_lng]
		], {
			paddingTopLeft:[305,0]
		});

		Mapper.mapBox.markerLayer({
			'type': 'Feature',
			'geometry': {
				'type': 'Point',
				'coordinates': [Mapper.geoData.school.lng, Mapper.geoData.school.lat]
			},
			'properties': {
				'marker-color': '#990000',
				'marker-size': 'large',
				'marker-symbol': 'college',
				'title': Mapper.geoData.school.name
			}
		}).addTo(Mapper.map);

		return true;
	}

	this.buildPropertyMarker = function(e) {
		var marker = e.layer,
			feature = marker.feature,
			address = feature.properties.address,
			rent = '$' + feature.properties.rent,
			distance,
			floorplans,
			featuredText = '';

		if(feature.properties.walking_time <= 20) {
			distance = '<div class="distancePreview" style="float:left;padding-right:6px;"><div class="maki-icon pitch"></div> ' + feature.properties.walking_time + ' min.</div><div class="distancePreview" style="float:left;"><div class="maki-icon car"></div> ' + feature.properties.driving_time + ' min.</div>';
		}
		else if(feature.properties.bicycling_time <= 20) {
			distance = '<div class="distancePreview" style="float:left;padding-right:6px;"><div class="maki-icon bicycle"></div> ' + feature.properties.bicycling_time + ' min.</div><div class="distancePreview" style="float:left;"><div class="maki-icon car"></div> ' + feature.properties.driving_time + ' min.</div>';
		}
		else {
			distance = '<div class="distancePreview" style="float:left;"><div class="maki-icon car"></div> ' + feature.properties.driving_time + ' min.</div>';
		}

		if(feature.properties.propertyType == 1) {
			if(feature.properties.floorplans == null) {
				floorplans = '1';
			}
			else {
				floorplans = feature.properties.floorplans.length;
			}
			featuredText = '' + floorplans + ' floor plans';
		}
		else {
			featuredText = feature.properties.bedrooms + ' bed / ' + feature.properties.bathrooms + ' bath';
		}

		// Create custom popup content
		var popupContent =  '<div class="row marker" style="background-image:url(' + feature.properties['featured-photo-large'] + ');" onclick="window.location.hash = \'#' + Mapper.geoData.school.id + '/' + feature.properties.id + '\'">' +
								'<div class="col-xs-12">' +
									'<h1><a href="#' + Mapper.geoData.school.id + '/' + feature.properties.id + '">' + address + '</a></h1>' +
									'<div class="map-popup-info-top-right">' +
										'<a href="#' + Mapper.geoData.school.id + '/' + feature.properties.id + '" class="btn btn-default btn-xs" style="color:#fff;background:transparent;padding-top:2px">More info <span class="glyphicon glyphicon-chevron-right"></span></a>' +
									'</div>' +
									'<div class="map-popup-info-bottom-right">' +
										'<p class="rent-preview">' + rent + '</p>' + 
										'<p>' + featuredText + '</p>' +
									'</div>' +
									'<div class="map-popup-info-left dark">' +
										distance +
									'</div>' +
								'</div>' +
							'</div>';

		// http://leafletjs.com/reference.html#popup
		marker.bindPopup(popupContent,{
			minWidth: 350,
			closeButton: false,
			autoPanPaddingTopLeft: [305,0]
		});

		return true;
	};

	this.buildBusinessMarker = function(e) {
		var marker = e.layer,
			properties = marker.feature.properties,
			address = properties.address + ', ' + properties.city + ', ' + properties.state + ' ' + properties.zip,
			yelp = '',
			website = '',
			phone;

		if(properties.yelp) {
			yelp = '<a href="' + properties.yelp + '" class="btn btn-default btn-xs" style="color:#fff;background:#111;background:rgba(0,0,0,0.4);padding-top:2px" target="new">View on Yelp</a><br>';
		}
		if(properties.website) {
			website = '<a href="' + properties.website + '" class="btn btn-default btn-xs" style="color:#fff;background:#111;background:rgba(0,0,0,0.4);padding-top:2px" target="new">Visit Website</a>';
		}
		if(properties.phone) {
			phone = '<p>' + phone + '</p>';
		}

		// Create custom popup content
		var popupContent =  '<div class="row marker" style="background-image:url(' + properties['photo'] + ');cursor:default;">' +
								'<div class="col-xs-12">' +
									'<h1 style="margin-bottom:-1px;padding-bottom:0">' + properties.name + '</h1>' +
									'<p style="margin-left:6px;">' + address + '</p>' +
									'<div class="map-popup-info-top-right" style="top:4px;right:6px;">' +
										yelp +
										website +
									'</div>' +
									'<div style="background: rgba(0,0,0,0.4);padding: 6px;width: 343px;position:absolute;bottom:0;left:0">' +
										'<p style="font-size:13px;margin-bottom:0">' + properties.description + '</p>' +
									'</div>' +
								'</div>' +
							'</div>';

		// http://leafletjs.com/reference.html#popup
		marker.bindPopup(popupContent,{
			minWidth: 350,
			closeButton: false,
			autoPanPaddingTopLeft: [305,0],
			offset: [0,-8]
		});
		marker.setIcon(Mapper.L.icon(properties.icon));
	};

	this.startCloseTimeout = function(id) {
		Mapper.timer = window.setTimeout(function() { Mapper.closePopupById(id); }, 600);
		return true;
	};

	this.buildListingInfoPage = function(id) {
		if(location.hash != '#' + Mapper.geoData.school.id + '/' + id) {
			location.hash = '#' + Mapper.geoData.school.id + '/' + id;
		}

		var listingsLength = Mapper.geoData.listings.length,
			data = null,
			index = 0;

		for(i = 0; i < listingsLength; i++) {
			if(Mapper.geoData.listings[i].properties.id == id) {
				data = Mapper.geoData.listings[i].properties,
				index = i;
			}
		}

		Mapper.jquery('#preview-' + Mapper.currentOpenProperty).css('background', '#ffffff');

		Mapper.currentOpenProperty = id;
		Mapper.currentOpenPropertyIndex = index;

		Mapper.jquery('#preview-' + id).css('background', 'rgba(66,139,202,0.1)');

		if(Mapper.jquery('#listingInformation').css('opacity') == '1' && Mapper.jquery('#listingInformationAddress1').text() == data.address) {
			Mapper.jquery('#listingInformation').animate({opacity:0}, 200, function() { Mapper.jquery('#listingInformation').hide(); });
			Mapper.jquery('#preview-' + id).css('background', '#ffffff');
			Mapper.currentOpenProperty = 0;
			return true;
		}

		document.title = data.address + ' - University Niche';

		if(data.propertyType == 1) {
			Mapper.jquery('#listingInformationHouse').hide();

			var floorPlansString = '<p style="font-weight:bold;font-size:16px;">Floor plans</p>' +
									'<table class="table table-striped">' + 
											'<tr>' +
												'<th>Name</th>' +
												'<th>Beds</th>' +
												'<th>Baths</th>' +
												'<th>Sqft</th>' +
												'<th>Price</th>' +
											'</tr>';
			if(data.floorplans == null) {
				floorPlansString += '<tr><td colspan="5">Contact this apartment for floor plan information</td></tr>';
			}
			else {
				for(i = 0; i < data.floorplans.length; i++) {
					var price = data.floorplans[i].price;
					if(price == 0) {
						price = 'Call';
					}
					else {
						price = '$' + price;
					}
					floorPlansString += '<tr>' +
											'<td>' + data.floorplans[i].name + '</td>' +
											'<td>' + data.floorplans[i].bedrooms + '</td>' +
											'<td>' + data.floorplans[i].bathrooms + '</td>' +
											'<td>' + data.floorplans[i].sqft + '</td>' +
											'<td>' + price + '</td>' +
										'</tr>';
				}
			}
			floorPlansString += '</table><p style="text-align:right;font-size:12px;margin:0;margin-top:-15px;"><em>* Individual rates subject to change</em></p>';
			Mapper.jquery('#listingInformationFloorplans').show().html(floorPlansString);
		}
		else {
			if(!data.sqft) {
				data.sqft = 'Not specified';
			}
			else {
				data.sqft = data.sqft + ' sq. ft.';
			}

			if(data.deposit == 0) {
				data.deposit = 'Call';
			}
			else {
				data.deposit = '$' + data.deposit;
			}

			Mapper.jquery('#listingInformationFloorplans').hide();
			Mapper.jquery('#listingInformationHouse').show();
			Mapper.jquery('#listingInformationRent').text(data.rent);
			Mapper.jquery('#listingInformationDeposit').text(data.deposit);
			Mapper.jquery('#listingInformationBedrooms').text(data.bedrooms);
			Mapper.jquery('#listingInformationBathrooms').text(data.bathrooms);
			Mapper.jquery('#listingInformationSqft').text(data.sqft);
			Mapper.jquery('#listingInformationDateAdded').text('Added ' + Math.round((new Date().getTime() - data.added_on) / 1000 / 60 / 60 / 24, 0) + ' days ago');
		}

		Mapper.jquery('#listingInformationAddress1').text(data.address);
		Mapper.jquery('#listingInformationAddress2').text(data.subtitle);
		Mapper.jquery('#listingInformationCampusDistance').text(data.campus_distance);
		Mapper.jquery('#listingInformationWalkingTime').text(data.walking_time);
		Mapper.jquery('#listingInformationBikingTime').text(data.bicycling_time);
		Mapper.jquery('#listingInformationDrivingTime').text(data.driving_time);
		Mapper.jquery('#listingInformationDescription').text(data.description);

		Mapper.jquery('#listingInformationThumbnails').parent().scrollLeft('0');

		var amenitiesString = '<ul>';
		for(i = 0; i < data.amenities.length; i++) {
			amenitiesString += '<li>' + data.amenities[i] + '</li>';
		}
		amenitiesString += '</ul>';
		if(data.other_amenities) {
			amenitiesString += '<p>' + data.other_amenities + '</p>';
		}

		if(data.amenities.length == 1 && !data.other_amenities) {
			amenitiesString = '<p>Contact this property owner for information about amenities.</p>'
		}

		Mapper.jquery('#listingInformationAmenities').html(amenitiesString);

		var thumbnailString = '';
		Mapper.currentOpenThumbnail = 0;
		for(i = 0; i < data.photos.length; i++) {
			if(i == 0) {
				activeClass = ' thumbnail-active';
			}
			else {
				activeClass = '';
			}
			thumbnailString += '<img src="static/uploads/thumbs/' + data.photos[i] + '.jpg" onclick="Mapper.changeImage(\'' + i + '\', \'' + data.photos[i] + '\')"  id="thumbnail' + i + '" class="thumbnail' + activeClass + '">';
		}
		Mapper.jquery('#listingInformationThumbnails').html(thumbnailString);

		Mapper.jquery('#listingInformationFeaturedImage').attr('src', data['featured-photo-large']);

		Mapper.jquery('#favorite').data('id', data.id);
		if(data.favorited) {
			Mapper.jquery('#favorite')
				.data('favorited', true)
				.html('<span class="glyphicon glyphicon-heart"></span> Favorited');
		}
		else {
			Mapper.jquery('#favorite')
				.data('favorited', false)
				.html('<span class="glyphicon glyphicon-heart-empty"></span> Favorite');
		}

		if(!data.landlord_phone) {
			$('#contactPhoneOpenModal').hide();
		}
		else {
			$('#contactPhoneOpenModal').show();
		}

		//Build the ad units
		if(data.ad_distances) {
			var numBusinesses = data.ad_distances.length;
			for(i=0; i < numBusinesses; i++) {
				Mapper.jquery('#listingInformationNearbyDistance' + data.ad_distances[i].id).html(data.ad_distances[i].distance + 'mi away');
				ga('send', 'event', 'Promotions', 'Property Information Impression', data.ad_distances[i].id);
			}
		}

		Mapper.jquery('#reportRented').removeClass('disabled').text('Mark this property as rented.');

		Mapper.jquery('#phoneContactProperty').val(data.id);
		Mapper.jquery('#emailContactProperty').val(data.id);
		Mapper.jquery('#phoneContactNumber').text(data.landlord_phone);

		Mapper.jquery('#twitterShareLink').attr('href', 'https://twitter.com/intent/tweet?url=http%3A%2F%2Funiversityniche.com%2F%23' + Mapper.geoData.school.id + '%2F' + data.id + '&via=universityniche&text=Check%20out%20this%20awesome%20property%20I%20found');
		Mapper.jquery('#facebookShareLink').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Funiversityniche.com%2F%23' + Mapper.geoData.school.id + '%2F' + data.id);

		if(Mapper.jquery('#listingInformation').css('opacity') == '1') {
			$("#listingInformation").animate({ scrollTop: 0 }, 200);
		}
		else {
			Mapper.jquery('#listingInformation').show().animate({opacity:1}, 150);
		}

		Mapper.positionMiniMap(Mapper.geoData.listings[index].geometry.coordinates[1], Mapper.geoData.listings[index].geometry.coordinates[0]);

		ga('send', 'event', 'Properties', 'View', id);

		ga('send', 'pageview', {
			'page': '/#' + Mapper.geoData.school.id + '/' + id,
			'title': data.address
		});

		return true;
	};

	this.changeImage = function(id, image) {
		Mapper.jquery('#listingInformationFeaturedImage').attr('src', 'static/uploads/images/' + image + '.jpg');
		Mapper.jquery('.thumbnail').removeClass('thumbnail-active');
		Mapper.jquery('#thumbnail' + id).addClass('thumbnail-active');
		Mapper.currentOpenThumbnail = id;
	};

	this.nextImage = function() {
		var nextThumbnailImage = parseInt(Mapper.currentOpenThumbnail) + 1;
		var nextThumbnailUrl = Mapper.geoData.listings[Mapper.currentOpenPropertyIndex].properties.photos[nextThumbnailImage];

		if(!nextThumbnailUrl) {
			return true;
		}

		if(!Mapper.geoData.listings[Mapper.currentOpenPropertyIndex].properties.photos[nextThumbnailImage + 1]) {
			Mapper.jquery('#nextThumbnail').css('color', '#ccc');
		}
		else {
			Mapper.jquery('#nextThumbnail').css('color', '#000');
		}
		Mapper.jquery('#previousThumbnail').css('color', '#000');

		var maxThumbs = Math.floor(Mapper.jquery('#listingInformationThumbnails').parent().width() / 75);
		var nextThumbValue = nextThumbnailImage + 1;
		if(nextThumbValue > maxThumbs) {
			Mapper.jquery('#listingInformationThumbnails').parent().animate({
				scrollLeft: parseInt((nextThumbValue - maxThumbs) * 78)
			}, 300);
		}

		Mapper.jquery('#listingInformationFeaturedImage').attr('src', 'static/uploads/images/' + nextThumbnailUrl + '.jpg');
		Mapper.jquery('.thumbnail').removeClass('thumbnail-active');
		Mapper.jquery('#thumbnail' + nextThumbnailImage).addClass('thumbnail-active');

		Mapper.currentOpenThumbnail = nextThumbnailImage;
	};

	this.previousImage = function() {
		var previousThumbnailImage = parseInt(Mapper.currentOpenThumbnail) - 1;
		var previousThumbnailUrl = Mapper.geoData.listings[Mapper.currentOpenPropertyIndex].properties.photos[previousThumbnailImage];

		if(!previousThumbnailUrl) {
			return true;
		}

		if(!Mapper.geoData.listings[Mapper.currentOpenPropertyIndex].properties.photos[previousThumbnailImage - 1]) {
			Mapper.jquery('#previousThumbnail').css('color', '#ccc');
		}
		else {
			Mapper.jquery('#previousThumbnail').css('color', '#000');
		}
		Mapper.jquery('#nextThumbnail').css('color', '#000');

		var maxThumbs = Math.floor(Mapper.jquery('#listingInformationThumbnails').parent().width() / 75);
		var previousThumbValue = previousThumbnailImage - 1;
		if(previousThumbValue < maxThumbs) {
			Mapper.jquery('#listingInformationThumbnails').parent().animate({
				scrollLeft: Mapper.jquery('#listingInformationThumbnails').parent().scrollLeft() - parseInt((previousThumbValue + maxThumbs) * 78)
			}, 300);
		}

		Mapper.jquery('#listingInformationFeaturedImage').attr('src', 'static/uploads/images/' + previousThumbnailUrl + '.jpg');
		Mapper.jquery('.thumbnail').removeClass('thumbnail-active');
		Mapper.jquery('#thumbnail' + previousThumbnailImage).addClass('thumbnail-active');

		Mapper.currentOpenThumbnail = previousThumbnailImage;
	};

	this.buildResources = function() {
		var length = Mapper.geoData.schoolResources.length,
			htmlString = '<ul>';

		for(i = 0; i < length; i++) {
			htmlString += '<li><strong>' + Mapper.geoData.schoolResources[i].type + ':</strong> <a href="' + Mapper.geoData.schoolResources[i].website + '">' + Mapper.geoData.schoolResources[i].name + '</a> (' + Mapper.geoData.schoolResources[i].phone + ')</li>';
		}
		htmlString += '</ul>';
		Mapper.jquery('#listingInformationResources').html(htmlString);
	};

	this.buildNearbyBusinesses = function() {
		var length = Mapper.geoData.listings.length,
			htmlString = '';

		for(i = 0; i < length; i++) {
			if(Mapper.geoData.listings[i].properties.type == 'business' && Mapper.geoData.listings[i].properties.plan != 1) {
				var address = Mapper.geoData.listings[i].properties.address + ', ' + Mapper.geoData.listings[i].properties.city + ', ' + Mapper.geoData.listings[i].properties.state + ' ' + Mapper.geoData.listings[i].properties.zip,
					yelp = '',
					website = '';

				if(Mapper.geoData.listings[i].properties.yelp) {
					yelp = '<a href="' + Mapper.geoData.listings[i].properties.yelp + '" class="btn btn-default btn-xs" style="color:#fff;background:rgba(0,0,0,0.4);padding-top:2px" target="new">View on Yelp</a><br>';
				}
				if(Mapper.geoData.listings[i].properties.website) {
					website = '<a href="' + Mapper.geoData.listings[i].properties.website + '" class="btn btn-default btn-xs" style="color:#fff;background:rgba(0,0,0,0.4);padding-top:2px;margin-top:2px;" target="new">Visit Website</a>';
				}

				htmlString += '<div class="row marker" style="background-image:url(' + Mapper.geoData.listings[i].properties.photo + ');cursor:default;margin-bottom: 12px;border: 1px solid #ccc;border-radius: 1px;">'+ 
								'<div class="col-xs-12">' +
									'<h1 style="margin-bottom:-1px;padding-bottom:0">' + Mapper.geoData.listings[i].properties.name + '</h1>' +
									'<p style="margin-left:6px;">' + address + '</p>' +
									'<div class="map-popup-info-top-right" style="top:4px;right:6px;">' +
										yelp +
										website +
									'</div>' +
									'<div style="background: rgba(0,0,0,0.4);padding: 6px;width: 100%;position:absolute;bottom:0;left:0">' + 
										'<div style="width:80%;float:left;"><p style="font-size:13px;margin-bottom:0">' + Mapper.geoData.listings[i].properties.description + '</p></div>' + 
										'<div style="width:20%;float:left;text-align:right;"><p id="listingInformationNearbyDistance' + Mapper.geoData.listings[i].properties.business_id + '"></p></div>' +
									'</div>' + 
								'</div>' + 
							'</div>';
			}
		}

		if(htmlString == '') {
			Mapper.jquery('#listingInformationNearby').parent().hide();
		}
		else {
			Mapper.jquery('#listingInformationNearby').html(htmlString).parent().show();
		}
		return true;
	}

	this.buildLeftPreview = function() {
		Mapper.jquery('#listingPane').fadeIn();

		if(Mapper.geoData.listings === null) {
			listingPreview = '<div class="row">' +
								'<div class="col-xs-12" style="text-align: center;font-size: 11px;font-weight: bold;text-transform: uppercase;color: #999;">' + 
									'<p>No properties found</p>' + 
									'<p><a id="clearSearch">Clear your search</a> to view all ' + Mapper.geoData.counts.total + ' properties near ' + Mapper.geoData.school.name + '</p>' +
								'</div>' +
							'</div>';
		}
		else {

			var data = Mapper.geoData.listings,
				length = data.length,
				listingPreview = '';
		
			for(var i = 0; i < length; i++) {
				if(data[i].properties.type == 'property') {
					featuredText = '';
					if(data[i].properties.favorited) {
						featuredText = '<br><p class="byline-text featured-text"><span class="glyphicon glyphicon-heart" style="color:#f1756b;"></span> Favorited</p>';
					}
					else if(data[i].properties.featured == 1) {
						featuredText = '<br><p class="byline-text featured-text"><span class="glyphicon glyphicon-star" style="color:#f1756b;"></span> Featured Listing</p>';
					}
					else if(data[i].properties.propertyType == 1) {
						if(data[i].properties.floorplans == null) {
							floorplans = '1';
						}
						else {
							floorplans = data[i].properties.floorplans.length;
						}
						featuredText = '<br><p class="byline-text">' + floorplans + ' floor plans</p>';
					}
					else {
						featuredText = '<br><p class="byline-text">' + data[i].properties.bedrooms + ' bed / ' + data[i].properties.bathrooms + ' bath</p>';
					}

					var currentDate = new Date().getTime(),
						offset = 86400000 * 3,
						newString = '';

					if(currentDate - data[i].properties.added_on < offset) {
						newString = '<p class="byline-text" style="margin-top: 1px;margin-right: 3px;color: #bc4738;">New!</p>';
					}

					listingPreview += '<div class="row listing-left-preview" data-popup-id="' + data[i].properties.id + '" data-listing-id="' + data[i].properties.id + '" id="preview-' + data[i].properties.id + '">' +
											'<div class="col-xs-8">' +
												'<h1>' + newString + '<a href="#' + Mapper.geoData.school.id + '/' + data[i].properties.id + '">' + data[i].properties.address + '</a></h1>' +
												featuredText +
											'</div>' +
											'<div class="col-xs-4" style="padding-right:0;">' +
												'<div style="float:right; color:#ececec; font-size:12px;margin-top: 8px;padding-left: 15px;"><span class="glyphicon glyphicon-chevron-right"></span></div>' +
												'<p>$' + data[i].properties.rent + '</p>' +
											'</div>' +
										'</div>';
				}
			}
			if(Mapper.geoData.counts.matches < Mapper.geoData.counts.total) {
				listingPreview += '<div class="row">' +
									'<div class="col-xs-12" style="text-align: center;font-size: 11px;font-weight: bold;text-transform: uppercase;color: #bbb;">' + 
										'<p>' + Mapper.geoData.counts.matches + ' properties found</p>' + 
										'<p><a id="clearSearch">Clear your search</a> to view all ' + Mapper.geoData.counts.total + ' properties near ' + Mapper.geoData.school.name + '</p>' +
									'</div>' +
								'</div>';
			}
		}
		Mapper.jquery('#listingPane').html(listingPreview);

		Mapper.jquery('.listing-left-preview').each(function() {
			Mapper.jquery(this).click(function() {
				Mapper.markerHoverOut(Mapper.jquery(this).data('popup-id'));
				if(location.hash == '#' + Mapper.geoData.school.id + '/' + Mapper.jquery(this).data('popup-id')) {
					Mapper.jquery('#preview-' + Mapper.currentOpenProperty).css('background', '#ffffff');
					Mapper.currentOpenProperty = 0;
					location.hash = '#' + Mapper.geoData.school.id;
				}
				else {
					location.hash = '#' + Mapper.geoData.school.id + '/' + Mapper.jquery(this).data('popup-id');
				}
			});
			Mapper.jquery(this).hover(
				function() {
					if(Mapper.jquery('#listingInformation').css('opacity') == '0') {
						Mapper.markerHoverIn(Mapper.jquery(this).data('popup-id'));
					}
				}
			);
		});

		Mapper.jquery('#clearSearch').click(function() {
			Mapper.clearSearch();
		});

		return true;
	};

	this.openPopupById = function(id) {
		Mapper.UIListingClickOverride = true;
		Mapper.map.markerLayer.eachLayer(function(marker) {
			if (marker.feature.properties.id == id) {
				marker.openPopup();
			}
		});
	};

	this.closePopupById = function(id) {
		console.log('Closing ' + id);
		Mapper.map.markerLayer.eachLayer(function(marker) {
			if (marker.feature.properties.id == id) {
				marker.closePopup();
			}
		});
	}

	this.markerHoverIn = function(id) {
		Mapper.UIListingClickOverride = false;
		Mapper.map.markerLayer.eachLayer(function(marker) {
			if (marker.feature.properties.id == id) {
				marker.openPopup();
			}
		});
	};

	this.markerHoverOut = function(id) {
		if(Mapper.UIListingClickOverride === true) {
			return;
		}
		else {
			Mapper.map.markerLayer.eachLayer(function(marker) {
				if (marker.feature.properties.id == id) {
					marker.closePopup();
				}
			});
		}
	};

	this.clearSearch = function() {
		Mapper.jquery('#searchHouse').removeClass('button-active');
		Mapper.jquery('#searchApartment').removeClass('button-active');
		Mapper.jquery('#searchRoom').removeClass('button-active');
		Mapper.jquery('#searchAll').removeClass('button-active').addClass('button-active');
		Mapper.jquery('#searchWalking').removeClass('button-active');
		Mapper.jquery('#searchBiking').removeClass('button-active');
		Mapper.jquery('#searchDriving').removeClass('button-active').addClass('button-active');
		Mapper.jquery('#searchRentLowerBound').val('');
		Mapper.jquery('#searchRentUpperBound').val('');
		Mapper.jquery('#searchBedrooms').val('');
		Mapper.jquery('#searchBathrooms').val('');

		Mapper.searchOptions = {
			'school': Mapper.searchOptions.school,
			'house': true,
			'apartment': true,
			'room': true,
			'rentLower': null,
			'rentUpper': null,
			'bedrooms': null,
			'bathrooms': null,
			'distance': 'driving'
		};

		Mapper.getListings();
	}
};