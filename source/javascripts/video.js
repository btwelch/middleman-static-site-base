VideoTimer = null;
Video = function() {

	//Clips for the videos
	this.clips = [
		['bike', 9900],
		['trackingstreet', 3900]
	];

	this.settings = {
		'videoContainer': $('#backgroundVideo'),
		'stagingContainer': $('#stagingVideo'),
		'videoWebM': $('#backgroundVideoWebM'),
		'videoMp4': $('#backgroundVideoMp4'),
		'stagingWebM': $('#stagingVideoWebM'),
		'stagingMp4': $('#stagingVideoMp4'),
		'supportedTypeExt': 'webm'
	};

	this.currentClip = 2;

	this.shuffle = function() {
		for (var i = Video.clips.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = Video.clips[i];
			Video.clips[i] = Video.clips[j];
			Video.clips[j] = temp;
		}

		return this;
	};

	this.throwFullScreen = function() {
		var browserHeight = $(window).height(),
			browserWidth = $(window).width(),
			videoHeight = 1280,
			videoWidth = 1920,
			videoRatio = videoWidth / videoHeight,
			scaleWidth = browserWidth / videoWidth,
			scaleHeight = browserHeight / videoHeight,
			scale = scaleHeight > scaleWidth ? scaleHeight : scaleWidth,
			fullScreenWidth = scale * videoWidth,
			fullScreenHeight = scale * videoHeight;

		if(scaleWidth > scaleHeight) {
			Video.settings.videoContainer.css('width', '100%');
			Video.settings.videoContainer.css('height', 'auto');
			Video.settings.stagingContainer.css('width', '100%');
			Video.settings.stagingContainer.css('height', 'auto');  
		}
		else {
			Video.settings.videoContainer.css('height', '100%');
			Video.settings.videoContainer.css('width', 'auto');
			Video.settings.stagingContainer.css('height', '100%');
			Video.settings.stagingContainer.css('width', 'auto'); 
		}
		
		$('#videoContainer').animate({opacity:1}, 2000);
	}

	this.stopVideo = function() {
		clearTimeout(VideoTimer);
		Video.settings.stagingContainer[0].pause();
		Video.settings.videoContainer[0].pause();
	}

	this.buildInitialVideo = function() {
		if(Video.settings.videoContainer[0].canPlayType('video/webm')) {
			Video.settings.supportedType = '.webm';
			Video.settings.videoContainer.attr('type', 'video/webm;codecs=\'vp8\'');
		}
		else {
			Video.settings.supportedType = '.mp4';
			Video.settings.videoContainer.attr('type', 'video/mp4;codecs=\'avc1.42E01E, mp4a.40.2\'');
		}

		Video.shuffle();

		Video.settings.videoContainer.attr('src', 'videos/' + Video.clips[0][0] + Video.settings.supportedType);
		Video.settings.videoContainer[0].load();

		Video.settings.stagingContainer.attr('src', 'videos/' + Video.clips[1][0] + Video.settings.supportedType);
		Video.settings.stagingContainer[0].load();
		Video.settings.stagingContainer[0].pause();

		VideoTimer = window.setTimeout(function() {
			console.log('looping');
			Video.loop();
		}, Video.clips[0][1]);

		return true;
	}

	this.loop = function() {
		VideoTimer = null;

		var nextClip = Video.clips[1][0],
			currentTime = Video.clips[1][1];

		if(!Video.clips[Video.currentClip + 1]) {
			Video.currentClip = 1;
			nextClip = Video.clips[1][0];
			currentTime = Video.clips[Video.clips.length - 1][1];
		}
		else {
			nextClip = Video.clips[Video.currentClip + 1][0];
			currentTime = Video.clips[Video.currentClip][1];
		}

		if(Video.settings.videoContainer.css('opacity') == 0) {
			Video.settings.videoContainer[0].play();
			Video.settings.videoContainer.animate({'opacity':1}, 150, function() {
				Video.settings.stagingContainer.animate({'opacity': 0}, 0);
				Video.settings.stagingContainer.attr('src', 'static/videos/' + nextClip + Video.settings.supportedType);
				Video.settings.stagingContainer[0].load();
				Video.settings.stagingContainer[0].pause();
			});
		}
		else {
			Video.settings.stagingContainer[0].play();
			Video.settings.stagingContainer.animate({'opacity':1}, 150, function() {
				Video.settings.videoContainer.animate({'opacity': 0}, 0);
				Video.settings.videoContainer.attr('src', 'static/videos/' + nextClip + Video.settings.supportedType);
				Video.settings.videoContainer[0].load();
				Video.settings.videoContainer[0].pause();
			});
		}
		Video.currentClip++;

		VideoTimer = window.setTimeout(function() {
			Video.loop();
		}, currentTime);
	};
}