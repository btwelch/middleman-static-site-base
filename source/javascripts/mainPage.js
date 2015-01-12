var Mapper = new Mapper();
Mapper.L = L;
Mapper.jquery = $;

$(document).ready(function() {

	//If desktop, initialize the map
	if($('#map').css('display') !== 'none') {
		window.setTimeout(function() { Mapper.initializeMap(); }, 200);
	}

	//Drop down for the school select
	$('#schoolSelect').click(function () {
		if($('#schoolList').data('open') == false) {
			$(document).click(function() {
				if($('#schoolList').data('hovered') == false) {
					$('#schoolList').slideUp(150, function() {
						$(this).data('open', false);
					});
				}
			});
			$('#schoolList').slideDown(150, function() {
				$(this).data('open', true);
			});
		}
		else {
			$(document).off('click');
			$('#schoolList').slideUp(150, function() {
				$(this).data('open', false);
			});
		}
	});

	//Capture hover state for school select
	$('#schoolSelect').hover(function() {
		$('#schoolList').data('hovered', true);
	}, function() {
		$('#schoolList').data('hovered', false);
	});

	//On hover, get listings--this makes the transition a lot more seamless at the expense of our bandwidth.
	//But hey, bandwidth is cheaper than users.
	$('.school-select-link').hover(function() {
		clearTimeout(Mapper.timer);
		Mapper.searchOptions.school = $(this).attr('href').match(/\d+/)[0];
		Mapper.timer = window.setTimeout(function() { 
			if(Mapper.map) { 
				Mapper.getListings(); 
			} 
			else { 
				Mapper.initializeMap(function() { Mapper.getListings() });
			} 
		}, 200);
	}, function() {
		clearTimeout(Mapper.timer);
	});

	//If they're loading a link with a school or a property, immediately jump to the property page
	var hash = location.hash;
	if(hash) {
		if(!window.oldInternetExplorer) {
			Video.stopVideo();
		}
		var school = hash.match(/\d+/),
			fullHash = hash.match(/\d+\/\d+/);

		if(!school) {
			return false;
		}
		Mapper.searchOptions.school = school[0];

		if($('#map').css('display') != 'none') {
			$('#map').show().css('opacity', 1);
		}

		if(fullHash) {
			Mapper.initializeMap(function() {
				Mapper.getListings(function() {
					Mapper.buildListingInfoPage(location.hash.match(/\d+\/\d+/)[0].split("/")[1]);
				});
			});
		}
		else {
			Mapper.initializeMap(function() {
				Mapper.getListings();
			});
		}

		$('#listingPaneContainer').show().css('opacity', 1);

		$('#topBarInnerLogo').removeClass('logo-landingpage').addClass('logo-mapview');

		ga('send', 'event', 'School', 'Selected', school[0]);

		$('.location-dialog,#videoContainer,.social-icons').hide();
	}

	//Event handler for url hash changes
	//This is important.
	$(window).hashchange(function(){ 
		var school = location.hash.match(/\d+/),
			fullHash = location.hash.match(/\d+\/\d+/);

		//handles empty hash /#
		if(!school) {
			if($('.location-dialog').css('display') == 'none') {
				document.title = 'University Niche';

				$('#topBarInnerLogo').removeClass('logo-mapview').addClass('logo-landingpage');

				Mapper.currentOpenProperty = 0;
				if(!window.oldInternetExplorer) {
					Video.loop();
				}
				$('.location-dialog,#videoContainer,.social-icons').show();

				$('#listingPaneContainer,#map,#listingInformation').animate({
						'opacity': 0
					}, 300, function() {
						$('#listingInformation').hide();

						$('#videoContainer,.location-dialog,.social-icons').animate({
							'opacity': 1
						}, 600);
					});
			}
			else {
				return true;
			}
		}
		//handles hash with school and property /#1/2
		else if(fullHash) {
			Mapper.buildListingInfoPage(fullHash[0].split("/")[1]);

		}
		//handles hash with just school if map is in view
		else if($('.location-dialog').css('display') == 'none') {
			document.title = 'University Niche';
			$('#listingInformation').animate({opacity:0}, 200, function() { $('#listingInformation').hide(); });
			ga('send', 'pageview', { 'page': '/#' + school[0], 'title': 'Map view'});
		}
		//handles transition from landing page to map view
		else {
			//Mobile transition
			if($('#map').css('display') === 'none') {
				Mapper.initializeMap();
				$('.location-dialog,.social-icons').hide();

				$('#listingPaneContainer').show();

				Mapper.searchOptions.school = school[0];
				Mapper.getListings();

				$('#listingPaneContainer').animate({
					'opacity': 1
				}, 1000, function() {
					$('#topBarInnerLogo').removeClass('logo-landingpage').addClass('logo-mapview');
				});
			}
			else {
				$('#videoContainer,.location-dialog,.social-icons').animate({
					'opacity': 0
				}, 300, function() {
					if(!window.oldInternetExplorer) {
						Video.stopVideo();
					}
					$('#videoContainer,.location-dialog,.social-icons').hide();

					$('#listingPaneContainer,#map').show();

					if(!Mapper.mapPopulated || Mapper.searchOptions.school != school[0]) {
						Mapper.searchOptions.school = school[0];
						Mapper.getListings();
					}

					$('#listingPaneContainer,#map').animate({
						'opacity': 1
					}, 1000, function() {
						$('#topBarInnerLogo').removeClass('logo-landingpage').addClass('logo-mapview');
					});

				});
			}
			ga('send', 'pageview', { 'page': '/#' + school, 'title': 'Map view'});
		}
	});

	$(document).keydown(function(e){
		//left
		if (e.keyCode == 37 && Mapper.currentOpenProperty !== 0) { 
			Mapper.previousImage();
			return false;
		}

		//right
		if (e.keyCode == 39  && Mapper.currentOpenProperty !== 0) { 
			Mapper.nextImage();
			return false;
		}

		//esc
		if (e.keyCode == 27  && Mapper.currentOpenProperty !== 0) { 
			location.hash = '#' + Mapper.geoData.school.id;
			$('#preview-' + Mapper.currentOpenProperty).css('background', '#ffffff');
			Mapper.currentOpenProperty = 0;
			$('#listingInformation').animate({opacity:0}, 200, function() { $('#listingInformation').hide(); });
			return false;
		}
	});

	$('#searchToggle').click(function() {
		if($('#listingTools').height() < 28) {
			$('#listingTools').animate({height:'193px'}, 400);
			$('#searchToggleArrowDown').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
		}
		else {
			$('#listingTools').animate({height:'25px'}, 400);
			$('#searchToggleArrowDown').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
		}
	});

	//Buttons
	$('#searchHouse').click(function() {
		$('#searchApartment,#searchRoom,#searchAll').removeClass('button-active');
		$('#searchHouse').addClass('button-active');
		Mapper.searchOptions.house = true;
		Mapper.searchOptions.apartment = false;
		Mapper.searchOptions.room = false;
		Mapper.getListings();
	});

	$('#searchApartment').click(function() {
		$('#searchHouse,#searchRoom,#searchAll').removeClass('button-active');
		$('#searchApartment').addClass('button-active');
		Mapper.searchOptions.house = false;
		Mapper.searchOptions.apartment = true;
		Mapper.searchOptions.room = false;
		Mapper.getListings();
	});

	$('#searchRoom').click(function() {
		$('#searchApartment,#searchHouse,#searchAll').removeClass('button-active');
		$('#searchRoom').addClass('button-active');
		Mapper.searchOptions.house = false;
		Mapper.searchOptions.apartment = false;
		Mapper.searchOptions.room = true;
		Mapper.getListings();
	});

	$('#searchAll').click(function() {
		$('#searchApartment,#searchRoom,#searchHouse').removeClass('button-active');
		$('#searchAll').addClass('button-active');
		Mapper.searchOptions.house = true;
		Mapper.searchOptions.apartment = true;
		Mapper.searchOptions.room = true;
		Mapper.getListings();
	});

	$('#searchWalking').click(function() {
		Mapper.searchOptions.distance = 'walking';
		$(this).addClass('button-active');
		$('#searchBiking').removeClass('button-active');
		$('#searchDriving').removeClass('button-active');
		Mapper.getListings();
	});

	$('#searchBiking').click(function() {
		Mapper.searchOptions.distance = 'biking';
		$(this).addClass('button-active');
		$('#searchWalking').removeClass('button-active');
		$('#searchDriving').removeClass('button-active');
		Mapper.getListings();
	});

	$('#searchDriving').click(function() {
		Mapper.searchOptions.distance = 'driving';
		$(this).addClass('button-active');
		$('#searchBiking').removeClass('button-active');
		$('#searchWalking').removeClass('button-active');
		Mapper.getListings();
	});

	//Text inputs
	var timer;
	$('#searchRentLowerBound')
		.keyup(function() {
			Mapper.searchOptions.rentLower = $(this).val();
			timer = window.setTimeout(function() { Mapper.getListings(); }, 500);
		})
		.keydown(function() {
			clearTimeout(timer);
		})
		.focus(function() {
			clearTimeout(timer);
		});

	$('#searchRentUpperBound')
		.keyup(function() {
			Mapper.searchOptions.rentUpper = $(this).val();
			timer = window.setTimeout(function() { Mapper.getListings(); }, 500);
		})
		.keydown(function() {
			clearTimeout(timer);
		})
		.focus(function() {
			clearTimeout(timer);
		});

	$('#searchBedrooms')
		.keyup(function() {
			Mapper.searchOptions.bedrooms = $(this).val();
			Mapper.getListings();
		});

	$('#searchBathrooms')
		.keyup(function() {
			Mapper.searchOptions.bathrooms = $(this).val();
			Mapper.getListings();
		});

	$('#nextThumbnail').click(function() {
		Mapper.nextImage();
	});
	$('#previousThumbnail').click(function() {
		Mapper.previousImage();
	});


	$('#listingInformationClose').click(function() {
		location.hash = '#' + Mapper.geoData.school.id;
		$('#preview-' + Mapper.currentOpenProperty).css('background', '#ffffff');
		Mapper.currentOpenProperty = 0;
		$('#listingInformation').animate({opacity:0}, 200, function() { $('#listingInformation').hide(); });
	});

	$('#contactPhoneOpenModal').click(function() {
		ga('send', 'event', 'Contact', 'Phone', 'Popup opened');

		$('#contactPhoneModal').show().animate({'opacity':'1'}, 250);
		$('#modalBackground2').show().animate({'opacity':'1'}, 250);
	});
	$('#contactPhoneCloseModal').click(function() {
		$('#modalBackground2').animate({'opacity':'0'}, 200, function() { $('#modalBackground2').hide(); });
		$('#contactPhoneModal').animate({'opacity':'0'}, 200, function() { $('#contactPhoneModal').hide(); });
	});

	$('#modalBackground2').click(function() {
		$('#modalBackground2').animate({'opacity':'0'}, 200, function() { $('#modalBackground2').hide(); });
		$('#contactPhoneModal').animate({'opacity':'0'}, 200, function() { $('#contactPhoneModal').hide(); });
		$('#contactEmailModal').animate({'opacity':'0'}, 200, function() { $('#contactEmailModal').hide(); });
	});

	$('#contactEmailOpenModal').click(function() {
		ga('send', 'event', 'Contact', 'Email', 'Popup opened');
		$('#contactEmailModal').show().animate({'opacity':'1'}, 250);
		$('#modalBackground2').show().animate({'opacity':'1'}, 250);
	});
	$('#contactEmailCloseModal').click(function() {
		$('#modalBackground2').animate({'opacity':'0'}, 200, function() { $('#modalBackground2').hide(); });
		$('#contactEmailModal').animate({'opacity':'0'}, 200, function() { $('#contactEmailModal').hide(); });
	});

	$('#favorite').click(function() {
		ga('send', 'event', 'Favorite', 'Click', 'Property favorited');
		if($('#favorite').data('favorited') == true) {
			$.get('favorite.php', {'remove-favorite': true, 'id': $('#favorite').data('id')})
				.done(function(data) {
					$('#favorite').data('favorited', false);
					$('#favorite').html('<span class="glyphicon glyphicon-heart-empty"></span> Favorite');
					Mapper.getListings();
				});	
		}
		else {
			$.get('favorite.php', {'add-favorite': true, 'id': $('#favorite').data('id')})
				.done(function(data) {
					$('#favorite').data('favorited', true);
					$('#favorite').html('<span class="glyphicon glyphicon-heart"></span> Favorited');
					Mapper.getListings();
				});
		}
	});

	$('#sendEmail').click(function() {
		var info = {
			'name' : $('#emailContactName').val(),
			'email': $('#emailContactEmail').val(),
			'phone': $('#emailContactPhone').val(),
			'message': $('#emailContactMessage').val(),
			'property': $('#emailContactProperty').val(),
			'type': 'email'
		};
		$.ajax({
			url: 'contact.php',
			type: 'post',
			dataType: 'json',
			data: info,
			success: function(data) {
				if(data.errorText) {
					$('#emailContactEmail')
						.css('border-color', '#ff6666')
						.css('background-color', 'rgba(255,102,102,0.1)')
						.tooltip({title: data.errorText, container: 'body'})
						.tooltip('show')
						.focus(function() {
							$('#emailContactEmail')
								.tooltip('destroy')
								.css('border-color', '#ccc')
								.css('background-color', 'rgba(255,102,102,0)');
						});
				}
				else {
					$('#sendEmail').prop('disabled', true).html('<span class="glyphicon glyphicon-envelope"></span> Message sent.');
					window.setTimeout(function() {
						$('#modalBackground2').animate({'opacity':'0'}, 200, function() { $('#modalBackground2').hide(); });
						$('#contactEmailModal').animate({'opacity':'0'}, 200, function() { $('#contactEmailModal').hide(); });
					}, 1500);
					ga('send', 'event', 'Contact', 'Email', 'Email sent');
				}
			}
		});
	});

	$('#sendPhone').click(function() {
		var info = {
			'phone': $('#phoneContactPhone').val(),
			'property': $('#phoneContactProperty').val(),
			'type': 'phone'
		};
		$.ajax({
			url: 'contact.php',
			type: 'post',
			dataType: 'json',
			data: info,
			success: function(data) {
				if(data.errorText) {
					$('#error').html('<div class="alert alert-danger">' + data.errorText + '</div>');
				}
				else {
					$('#sendPhone').prop('disabled', true).html('<span class="glyphicon glyphicon-earphone"></span> Dialing...');
					window.setTimeout(function() {
						$('#modalBackground2').animate({'opacity':'0'}, 200, function() { $('#modalBackground2').hide(); });
						$('#contactPhoneModal').animate({'opacity':'0'}, 200, function() { $('#contactPhoneModal').hide(); });
					}, 2000);
					ga('send', 'event', 'Contact', 'Phone', 'Phone called');
				}
			}
		});
	});

	$('#reportRented').click(function() {
		var info = {
			'id': Mapper.currentOpenProperty,
			'type': 'rented'
		};
		$.ajax({
			url: 'report.php',
			type: 'post',
			dataType: 'json',
			data: info,
			success: function() {
				$('#reportRented').addClass('disabled').text('Thank you! We\'ll review this property.');
				ga('send', 'event', 'Report', 'Property reported', info.id);
			}
		});
	});

	$('#mailingList').click(function() {
		var info = {
			'email': $('#mailingListEmail').val(),
			'school': Mapper.searchOptions.school
		};
		if(info.email == '') {
			return;
		}
		else {
			$.ajax({
				url: 'mailingList.php',
				type: 'post',
				dataType: 'json',
				data: info,
				success: function(data) {
					$('#mailingListEmail').prop('disabled', true).val('Thanks!');
					$('#mailingList').prop('disabled', true);
					ga('send', 'event', 'Mailing List', 'Added', info.school);
				}
			});
		}
	});

});