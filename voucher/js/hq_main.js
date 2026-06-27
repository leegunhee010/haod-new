let player = null;
let eventTargetPlayer = null;
let currentVideo = null;
$(function(){

	cloneFirstVisualText();

	let progTotal = $('.visual-swiper .swiper-slide').length;
	let currentSlideIndex = 0;
	let slideTimer = null;

	function getRealSlideByIndex(index) {
		const slide = document.querySelector(`.visual-swiper .swiper-slide[data-swiper-slide-index="${index}"]:not(.swiper-slide-duplicate)`);
		return slide || null;
	}

	const visualSwiper = new Swiper(".visual-swiper", {
		allowTouchMove: false,
		slidesPerView: 1,
		spaceBetween: 0,
		speed: 800, // 전환 속도를 0.8초로 설정
		loop: true,
		autoplay: false, // 초기에는 꺼둠
		navigation: {
			prevEl: ".mVisual .visual-arr.prev",
			nextEl: ".mVisual .visual-arr.next",
		},
		on: {
			init: function () {
				// 초기화 시 번호 표시
				$('.mVisual .progress-num .prog-num').text(String(1).padStart(2, '0'));
				$('.mVisual .progress-num .prog-total').text(String(progTotal).padStart(2, '0'));

				currentSlideIndex = this.realIndex;
			},
			slidePrevTransitionStart: function () {
				$(".visual-inner > .visual-title").remove();
			
				const progIdx = this.realIndex + 1; // 이미 전환된 슬라이드 인덱스 기준
				$('.mVisual .progress-num .prog-num').text(String(progIdx).padStart(2, '0'));
			
				currentSlideIndex = this.realIndex;

				// 실행중이던 동영상 정지처리
				if(currentVideo){
					currentVideo.pause();
				}
			
				// 이전 슬라이드일 때만 동작할 게 있다면 여기서 처리
				const slide = getRealSlideByIndex(this.realIndex);
				handleSlideContent(slide, 'prev'); // 방향 전달도 가능
			},
			slideNextTransitionStart: function () {
				$(".visual-inner > .visual-title").remove();
				let progIdx = this.realIndex + 1;
				$('.mVisual .progress-num .prog-num').text(String(progIdx).padStart(2, '0'));
			
				currentSlideIndex = this.realIndex;

				// 실행중이던 동영상 정지처리
				if(currentVideo){
					currentVideo.pause();
				}
			
				// 슬라이드 전환 시 콘텐츠 처리
				const slide = getRealSlideByIndex(this.realIndex);
				handleSlideContent(slide);
				// console.log('handleSlideContent');
			},
			transitionEnd: function(){
				// console.log($('.visual-swiper .swiper-slide-active').find('.visual-title')[0]);
				$('.visual-swiper .swiper-slide').find('.visual-title').css('opacity', 1);
			}
		},
	});

	// 텍스트 애니메이션
	function animateTitle(slide) {
		const titles = slide.querySelectorAll('.visual-title h2'); // 모든 h2
		const desc = slide.querySelector('.visual-title p');
	
		if (!titles.length || !desc) return;
	
		titles.forEach((title, index) => {
			gsap.fromTo(title, {
				opacity: 0,
				y: 80
			}, {
				opacity: 1,
				y: 0,
				duration: 0.6,
				ease: "power2.out",
				delay: 0.6 + index * 0.2 // 순차적으로 등장
			});
		});
	
		gsap.fromTo(desc, {
			opacity: 0,
			y: 80
		}, {
			opacity: 1,
			y: 0,
			duration: 0.6,
			ease: "power2.out",
			delay: 0.6 + titles.length * 0.2 // h2 다음에 등장
		});
	}
	
	const imgChangeTime = 7000; // 7초

	// 슬라이드 콘텐츠 처리 함수 (비디오 재생 또는 이미지 타이머)
	let hasRenderedVideo = false;
	async function handleSlideContent(slide) {
		if (!slide) return;

		// 이전 타이머 제거
		clearTimeout(slideTimer);

		const isMobile = window.innerWidth <= 768;
		const video = slide.querySelector(isMobile ? '.mo-video' : '.pc-video');
		const youtubeIframe = slide.querySelector('.youtube .video-wrap iframe');
		
		// console.log('슬라이드 콘텐츠 확인:', {
		// 	video: video ? '있음' : '없음',
		// 	youtubeIframe: youtubeIframe ? '있음' : '없음'
		// });

		if (video) {
			// console.log('비디오구간 handleSlideContent');
			// 비디오 슬라이드 처리
			visualSwiper.autoplay.stop();
			
			video.currentTime = 0;
			video.onended = null;
			video.muted = true;
			video.playsInline = true;

			currentVideo = video;

			gsap.to(video, {
				scale: 1,
				duration: 3,
				onComplete: () => {
					// video.play().then(() => {
					// 	console.log('video started');
					// }).catch(err => {
					// 	console.warn('video play error:', err);
					// });
					
					hasRenderedVideo = true;
		
					video.onended = () => {
						if (!slide.classList.contains('swiper-slide-duplicate')) {
							visualSwiper.slideNext();
							// console.log('비디오 끝남');
						}
					};
				}
			});
		} else if (youtubeIframe) {
			// console.log('유튜브구간 handleSlideContent');
			// YouTube iframe 처리
			visualSwiper.autoplay.stop();
			
			// YouTube API를 사용하여 동영상 길이 가져오기
			const videoId = youtubeIframe.src.match(/embed\/([^?]+)/)[1];
			const apiKey = 'AIzaSyAX6hidOZ4D47IPxoDF1hBfwNevxKcHKCU';
			
			// console.log('YouTube 동영상 ID:', videoId);

			
			fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails`)
				.then(response => response.json())
				.then(data => {
					// console.log('YouTube API 응답:', data);
					const duration = data.items[0].contentDetails.duration;
					const durationInSeconds = convertYouTubeDuration(duration);
					// console.log('동영상 길이:', durationInSeconds, '초');
										
					// gsap.to(youtubeIframe, {
					// 	opacity: 1,
					// 	scale: 1,
					// 	duration: 3,
					// 	onComplete: () => {
					// 		console.log('애니메이션 완료, 재생 시작');
							
					// 		// YouTube Player 생성
					// 		player = new YT.Player(youtubeIframe.parentElement, {
					// 			height: '100%',
					// 			width: '100%',
					// 			videoId: videoId,
					// 			// playerVars: {
					// 			// 	'autoplay': 1,
					// 			// 	'mute': 1,
					// 			// 	'loop': 1,
					// 			// 	'controls': 0,
					// 			// 	'modestbranding': 1,
					// 			// 	'rel': 0,
					// 			// 	'showinfo': 0,
					// 			// 	'iv_load_policy': 3
					// 			// },
					// 			events: {
					// 				'onReady': (event) => {
					// 					// event.target.playVideo();
					// 					console.log('YouTube 플레이어 준비 완료');
					// 				},
					// 				'onStateChange': (event) => {
					// 					if (event.data === YT.PlayerState.ENDED) {
					// 						console.log('동영상 재생 완료');
					// 						if (!slide.classList.contains('swiper-slide-duplicate')) {
					// 							visualSwiper.slideNext();
					// 						}
					// 					}
					// 				}
					// 			}
					// 		});
					// 	}
					// });
				})
				.catch(error => {
					console.error('YouTube API 에러:', error);
					// API 에러 시 기본 시간(7초) 후 다음 슬라이드로 이동
					setTimeout(() => {
						if (!slide.classList.contains('swiper-slide-duplicate')) {
							visualSwiper.slideNext();
						}
					}, imgChangeTime);
				});

			// console.log('youtubeIframe.parentElement', youtubeIframe.parentElement)
			if(!player){
				// console.log('player 넣기')
				player = new YT.Player(youtubeIframe.parentElement, {
					height: '300px',
					width: '200px',
					videoId: videoId,
					playerVars: {
						'autoplay': 0,
						'mute': 1,
						'loop': 1,
						'controls': 0,
						'modestbranding': 1,
						'rel': 0,
						'showinfo': 0,
						'iv_load_policy': 3
					},
					events: {
						'onReady': (event) => {
							eventTargetPlayer = event.target;
							event.target.playVideo();
							// console.log('YouTube 플레이어 준비 완료');
						},
						'onStateChange': (event) => {
							if (event.data === YT.PlayerState.ENDED) {
								// console.log('동영상 재생 완료');
								if (!slide.classList.contains('swiper-slide-duplicate')) {
									visualSwiper.slideNext();
								}
							}
						}
					}
				});
			}

			if(eventTargetPlayer){
				eventTargetPlayer.playVideo();
			}

			// console.log('player', player);
		} else {
			// console.log('이미지구간 handleSlideContent');
			// 이미지 슬라이드 처리
			slideTimer = setTimeout(() => {
				// console.log('이미지구간 타이머')
				visualSwiper.slideNext();
			}, imgChangeTime);
		}

		// 타이틀 애니메이션 실행
		animateTitle(slide);
	}

	// YouTube 동영상 길이 변환 함수
	function convertYouTubeDuration(duration) {
		const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
		const hours = (match[1] || '').replace('H', '') || 0;
		const minutes = (match[2] || '').replace('M', '') || 0;
		const seconds = (match[3] || '').replace('S', '') || 0;
		return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
	}

	// 첫 로딩 타이틀 애니메이션
	gsap.timeline({
		defaults: {
			ease: "power2.out",
		}
	})
	.fromTo('.visual-title h2', {
		opacity: 0,
		y: 80
	}, {
		opacity: 1,
		y: 0,
		duration: 0.5,
		delay: 0.3
	})
	.fromTo('.visual-title p', {
		opacity: 0,
		y: 80
	}, {
		opacity: 1,
		y: 0,
		duration: 0.5
	}, "-=0.1")
	.fromTo('.visual-image', {
		opacity: 0,
		y: 80
	}, {
		opacity: 1,
		y: 0,
		duration: 0.5
	}, "-=0.1");

	gsap.set('.visual-inner', {
		height: '100svh',
		maxHeight: '100svh'
	});

	// 반응형 값 처리 함수
	function getResponsiveValue(type) {
		const windowWidth = window.innerWidth;

		if (type === 'scale') {
			return windowWidth >= 1440 ? 1.1 : 1.5;
		} else if (type === 'inset') {
			return windowWidth >= 1440 ? "7%" : "20px";
		} else if (type === 'top') {
			return windowWidth > 768 ? "57%" : "60%";
		}
	}

	// ScrollTrigger 및 이미지 확장 애니메이션 + 슬라이드 실행
	let gsapTriggered = false;
	gsap.timeline({
		scrollTrigger: {
			id: "visual-inner",
			pin: '.visual-inner',
			pinSpacing: true,
			scrub: 1,
			start: "top top",
			end: '+=200%',
			onUpdate: (self) => {

				if (self.progress > 0.5) {
					$('.visual-inner').addClass('show-item');
					$(".control-wrap").fadeIn();
					$('#header').addClass('transparent-bg');
					$('#header .header-body').addClass('transparent-inner');
					if($('.visual-swiper .swiper-slide-active').find('video')[0]){
						$('.visual-swiper .swiper-slide-active').find('video')[0].play();
					}else if($('.visual-swiper .swiper-slide-active').find('.youtube .video-wrap iframe')[0]){
						// console.log('youtube');
						if(eventTargetPlayer){
							eventTargetPlayer.playVideo();
						}
					}else{
						if(gsapTriggered){
							slideTimer = setTimeout(() => {
								visualSwiper.slideNext();
							}, imgChangeTime);
							gsapTriggered = false;
						}
					}
				} else {
					$('.visual-inner').removeClass('show-item');
					$(".control-wrap").fadeOut();
					$('#header').removeClass('transparent-bg');
					$('#header .header-body').removeClass('transparent-inner');
					cloneFirstVisualText();
					
					if($('.visual-swiper .swiper-slide-active').find('video')[0]){
						$('.visual-swiper .swiper-slide-active').find('video')[0]?.pause();
					}else if($('.visual-swiper .swiper-slide-active').find('.youtube .video-wrap iframe')[0]){
						if(eventTargetPlayer){
							eventTargetPlayer.pauseVideo();
						}
					}else{
						if(slideTimer) clearTimeout(slideTimer);
						gsapTriggered = true; 
					}
					// $('.visual-swiper .swiper-slide-active').find('video')[0].currentTime = 0;
				}
			}
		}
	})
	.fromTo('.visual-image', 1.9, {
		clipPath: `inset(${getResponsiveValue('top')} ${getResponsiveValue('inset')} 0% round 0px)`,
		y: 20
	}, {
		clipPath: "inset(20% 15% 20% round 0px)",
		y: 0
	}, 'key')
		.to('.visual-inner', { opacity: 1 }, 'key')
		.to('.visual-image', { zIndex: 1 }, 'key')
		.fromTo(".visual-image .visual-swiper", 1.9, {
		scale: getResponsiveValue('scale'),
		y: window.innerWidth >= 1450 ? window.innerHeight - 150 : window.innerHeight
	}, {
		scale: 1,
		y: 0,
		onComplete: () => {
			// console.log('onComplete image');
			// $(".visual-swiper .swiper-slide-active").find('video')[0].play();
			const slide = getRealSlideByIndex(currentSlideIndex);
			if (slide) handleSlideContent(slide);
		}
	}, 'key')
	.fromTo(".visual-image", 1.9, {
		clipPath: "inset(20% 15% 20% round 0px)"
	}, {
		clipPath: "inset(0% 0% 0% round 0px)"
	}, 'key2')
	.to(".visual-image", 2, {
		clipPath: "inset(0% 0% 0% round 0px)",
		onComplete: () => {
			// 메인 비주얼 애니메이션 완료 후 다른 섹션 표시
			$('#main > section:not(.mVisual)').addClass('show');
		}
	}, 'key3');

	/*
	| ----------------------------------------------------------------------------------------
	| section1 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	gsap.timeline({
		scrollTrigger: {
			trigger: '.section1 .tit-area',
			start: 'top 60%',
			// end: 'bottom 50%',
			toggleActions: 'play none none reverse',
			// markers: true,
		}
	})
	.from('.section1 .tit-box b, .section1 .tit-box h3', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out'
	})
	.from('.section1 .tit-box p', {
		opacity: 0,
		y: 50,
		duration: 0.5,
		ease: 'power2.out',
		onComplete: function() {
			startTextAnimation('.section1');  // p 애니메이션 완료 후 텍스트 채우기 시작
		}
	}, "-=0.2")  // b와 h3 애니메이션이 끝나기 전에 시작
	.to('.count', {
		textContent: pageTitle,
		duration: 0.5,
		ease: "none",
		snap: { textContent: 1 },
		onUpdate: function() {
			const value = Math.floor(this.targets()[0].textContent);
			this.targets()[0].innerHTML = value.toLocaleString() + '+';
		}
	}, "+=0.1")  // p 애니메이션 완료 후 0.1초 뒤
	.from('.section1 .projects-img-wrap', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out'
	}, "+=0.1");  // count 완료 후 0.1초 뒤

	// 전역 변수로 선언
	let isMobileInitialized = false;

	// 리사이즈 이벤트 핸들러
	function handleResize() {
		if (window.innerWidth <= 1024 && !isMobileInitialized) {
			var projectsImgBoxes = $('.projects-img-wrap .projects-img-box');
			
			projectsImgBoxes.each(function(index) {
				var $currentBox = $(this);
				var $items = $currentBox.find('li');
				var itemCount = $items.length;
				
				function makeClone() {
					// 뒤에 복제본 추가
					for(var i = 0; i < itemCount; i++) {
						var $clone = $items.eq(i).clone();
						$currentBox.append($clone);
					}
					
					// 앞에 복제본 추가
					for(var i = itemCount - 1; i >= 0; i--) {
						var $clone = $items.eq(i).clone();
						$currentBox.prepend($clone);
					}
				}
				
				makeClone();
				
				const direction = (index === 1) ? -1 : 1;
				let totalWidth;
				if(window.innerWidth >= 768){
					totalWidth = 365 * itemCount;
				}else{
					totalWidth = 236 * itemCount;
				}
				
				const startPosition = direction === 1 ? -totalWidth : -totalWidth * 2;
				
				gsap.set($currentBox[0], {
					x: startPosition
				});
		
				gsap.to($currentBox[0], {
					x: direction * -totalWidth + startPosition,
					duration: 15,
					ease: "none",
					repeat: -1,
					modifiers: {
						x: gsap.utils.unitize((x) => {
							const currentX = parseFloat(x);
							return direction === 1 ? 
								(currentX % totalWidth) - totalWidth :
								(currentX % totalWidth);
						})
					}
				});
			});
			
			isMobileInitialized = true;
		} else if (window.innerWidth > 1024) {
			isMobileInitialized = false;
			const imgWrap = document.querySelector('.projects-img-wrap');
			let imgWrapHeight = imgWrap ? imgWrap.offsetHeight : 0;

			// window.addEventListener('resize', () => {
			// 	imgWrapHeight = imgWrap.offsetHeight;
			// });

			return gsap.timeline({
				scrollTrigger: {
					trigger: '.section1',
					start: 'top top',
					end: () => `+=${(imgWrapHeight / 2) + window.innerHeight}`,
					pin: true,
					pinSpacing: true,
					anticipatePin: 1,
					scrub: 1,
					// markers: true
				}
			})
			.from('.section1 .tit-area, .section1 .cont-area', {
				x: '-65vw',
				duration: 3.5,
				ease: 'none',
			})
			.to('.section1 .projects-img-box:nth-child(1)', {
				y: '45%',
				duration: 5,
				ease: 'none'
			}, 0)
			.to('.section1 .projects-img-box:nth-child(2)', {
				y: '82%',
				duration: 5,
				ease: 'none'
			}, 0)
			.to('.section1 .projects-img-box:nth-child(3)', {
				y: '62%',
				duration: 5,
				ease: 'none'
			}, 0);
		}
	}

	// 초기 실행
	handleResize();

	/*
	| ----------------------------------------------------------------------------------------
	| section2 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	gsap.timeline({
		scrollTrigger: {
			trigger: '.section2 .tit-area', // `.section2` 기준으로 트리거 설정
			start: 'top 80%',
			toggleActions: 'play none none reverse',
			// markers: true,
		}
	}).from('.section2 .tit-box b, .section2 .tit-box h3', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out'
	}).from('.section2 .tit-box p', {
		opacity: 0,
		y: 50,
		duration: 0.5,
		ease: 'power2.out',
	}).from('.section2 .card-cont-wrap', {
		opacity: 0,
		duration: 1,
		ease: 'power2.out',
		onComplete: function() { 
			startTextAnimation('.section2');
		}
	});

	// What We Do 카드 — 가로 슬라이더(Swiper)로 전환 (기존 핀 카드스택 제거)
	if (document.querySelector('.cards-swiper') && typeof Swiper !== 'undefined') {
		new Swiper('.cards-swiper', {
			slidesPerView: 1.05,
			spaceBetween: 18,
			centeredSlides: true,
			loop: true,
			grabCursor: true,
			speed: 650,
			autoplay: { delay: 3000, disableOnInteraction: false },
			pagination: { el: '.cards-pagination', clickable: true },
			navigation: { nextEl: '.cards-next', prevEl: '.cards-prev' },
			breakpoints: {
				768:  { slidesPerView: 1.5, spaceBetween: 24 },
				1200: { slidesPerView: 2.1, spaceBetween: 30 }
			}
		});
	}

	/*
	| ----------------------------------------------------------------------------------------
	| section3 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	gsap.fromTo(".section3 .ani_items", 
        { autoAlpha: 0, y: 50 }, 
        {
            autoAlpha: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.2,
            ease: 'Bounce.easeOut.easeOut',
            scrollTrigger: {
                trigger: ".section3",
				toggleActions: 'play none none reverse',
                start: "top 60%", // 애니메이션 시작 위치
                // end: "bottom top",  // 애니메이션 끝 위치
                // scrub: true,        // 스크롤과 애니메이션의 동기화 여부
                // markers: true       // 디버깅을 위한 시작과 끝 마커 표시
			}
		}
    );

	gsap.fromTo(".section3 .ani_items1", 
        { autoAlpha: 0, y: 50 }, 
        {
            autoAlpha: 1,
            y: 0,
            stagger: 0.2,
            duration: 0.5,
            ease: 'Bounce.easeOut.easeOut',
            scrollTrigger: {
                trigger: ".section3 .ani_items",
				toggleActions: 'play none none reverse',
                start: "top 60%", // 애니메이션 시작 위치

                // end: "bottom top",  // 애니메이션 끝 위치
                // scrub: true,        // 스크롤과 애니메이션의 동기화 여부
               	// markers: true       // 디버깅을 위한 시작과 끝 마커 표시
			}
		}
    );

	/*
	| ----------------------------------------------------------------------------------------
	| section4 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	// 1. 타임라인 정의
	// 전체 Timeline + ScrollTrigger 통합
const myTimeline = gsap.timeline({
	scrollTrigger: {
	  trigger: ".section4",
	  start: "top top",
	  end: "+=800", // 충분히 길게 잡아서 마지막 애니까지 보여줌
	  pin: true,
	  scrub: 0.5,
	//   markers: true,
	}
  });
  
  myTimeline
	.fromTo(".section4 .ani_items",
	  { autoAlpha: 0 },
	  { autoAlpha: 1, duration: 0.3, stagger: 0.1, ease: "power2.inOut" }
	)
	.to(".section4 .ani_items",
	  { autoAlpha: 0.3, duration: 0.2, ease: "power2.inOut" },
	  ">"
	)
	.set("#main .section4 .main-txt", { zIndex: 99 }, "<")
	.fromTo(".section4 .main-txt > strong.ani_items1",
	  { autoAlpha: 0, y: 50 },
	  { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }
	)
	.fromTo(".section4 .circle.ani_items1",
	  { autoAlpha: 0, scale: 0.5 },
	  { 
		autoAlpha: 1, 
		scale: 1, 
		duration: 0.3, 
		ease: "power2.out",
		onComplete: () => document.querySelector(".section4 .circle.ani_items1")?.classList.add("on"),
		onReverseComplete: () => document.querySelector(".section4 .circle.ani_items1")?.classList.remove("on")
	  }
	)
	.fromTo(".section4 .circle-wrap > strong.ani_items1",
	  { autoAlpha: 0, y: 50 },
	  { 
		autoAlpha: 1, 
		y: 0, 
		duration: 0.3, 
		ease: "power2.out",
		onComplete: () => {
		  // Lenis는 stop/start 없이 자연스럽게 이어지도록
		  if (window.lenis && window.lenis.start) window.lenis.start();
		}
	  }
	);
	
	/*
	| ----------------------------------------------------------------------------------------
	| section5 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	var progTotal1 = $('.solution-swiper .swiper-slide').length;

	var solutionSwiper = new Swiper(".solution-swiper", {
		effect: "fade",
		slidesPerView: 1,
		spaceBetween: 0,
		loop: true,
		autoplay: false, // 초기에는 autoplay 비활성화
		navigation: {
			prevEl: ".solution-swiper .visual-arr.prev",
			nextEl: ".solution-swiper .visual-arr.next",
		},
		on: {
			init: function(){
				/* 커스텀한 progress 숫자 */
				$('.solution-swiper .progress-num .prog-num').text(String(1).padStart(2, '0'));
				$('.solution-swiper .progress-num .prog-total').text(String(progTotal1).padStart(2, '0'));
			},
			slideChange: function (){
				var progIdx = this.realIndex + 1;

				/* 커스텀한 progress 숫자 */
				$('.solution-swiper .progress-num .prog-num').text(String(progIdx).padStart(2, '0'));
				$('.solution-swiper .progress-num .prog-total').text(String(progTotal1).padStart(2, '0'));
			},
		},
	});

	gsap.timeline({
		scrollTrigger: {
			trigger: '.section5', 
			start: 'top 60%',
			toggleActions: 'play none none reverse',
			// markers: true,
		}
	})
	.from('.section5 .tit-box', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out',
		onComplete: function() { 
			startTextAnimation('.section5');
		}
	})
	.from('.section5 .cont-area .img', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out',
	})
	.from('.section5 .cont-area .txt', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out',
		onComplete: function() { 
			// 애니메이션 완료 후 autoplay 시작
			solutionSwiper.params.autoplay = {
				delay: 5000,
				disableOnInteraction: false
			};
			solutionSwiper.autoplay.start();
		}
	});
	// ScrollTrigger로 섹션 진입/이탈 시 autoplay 제어
	ScrollTrigger.create({
		trigger: '.section5',
		start: 'top 50%',
		end: 'bottom top',
		onLeave: () => {
			solutionSwiper.autoplay.stop();
		},
		onEnterBack: () => {
			solutionSwiper.autoplay.start();
		},
		onLeaveBack: () => {
			solutionSwiper.autoplay.stop();
		}
	});

	/*
	| ----------------------------------------------------------------------------------------
	| section6 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/

	gsap.fromTo('.section6 .ani_items', 
        { opacity: 0, y: 50 },
        {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: ".section6",
                start: window.innerWidth > 960 ? "top top" : "top 50%",
                toggleActions: "play none none reverse",
                // markers: true
            }
        }
    )

	let section6ListLength = $(".section6 .list").length;
	let section6tl;
	let section6scrub;
	let section6resize = false;
	let section6arry = [];

	function section6set() {
		const ww = $(window).width();
		const wh = $(window).height();
		const scrollDown = false;

		if (ww > 960) {
			const listBxH = $(".section6 .listBx").height();
			const totalItems = $(".section6 .list").length;
			const visibleItems = totalItems; // 실제 아이템 개수만큼 표시
			const rotationPerItem = 360 / totalItems; // 전체 회전각(360도)을 아이템 개수로 나눔
			const zDistance = "calc(400/60*1em)"; // Z축 거리

			// 초기 마진 설정
			gsap.set(".section6", { marginTop: -(listBxH * 0.4) });
			// 전체 아이템 수에 따라 스크롤 높이 조정 (아이템당 60px 정도의 스크롤 영역)
			const scrollHeight = Math.max(wh, totalItems * 60);
			gsap.set(".section6 .wrap", { opacity: 1 });
	
			// 각 리스트 아이템의 초기 위치 설정
			$(".section6 .list").each((index, element) => {
				// **수정: n1이 맨 앞에 오도록 오프셋 조정**
				const offset = -((index - totalItems + visibleItems) % totalItems);
				const rotation = offset * rotationPerItem;
				
				const isVisible = Math.abs(rotation) <= 90;
				
				gsap.set(element, {
					transform: `rotateX(${rotation}deg) translate3d(0,0,${zDistance})`,
					opacity: isVisible ? (1 - Math.abs(offset) * 0.2) : 0,
					pointerEvents: isVisible ? "auto" : "none",
					visibility: isVisible ? "visible" : "hidden"
				});
			});
	
			// 모션 타임라인
			section6tl = gsap
				.timeline({
					defaults: { ease: "none" }
				})
				.to(".section6 .listBx", { 
					rotateX: rotationPerItem * totalItems,
					duration: 1,
					ease: "none"
				});
	
				let currentIndex = -1;

				section6scrub = ScrollTrigger.create({
				  trigger: ".section6 .wrap",
				  start: "center center",
				  end: `+=${scrollHeight}`,
				  pin: true,
				  animation: section6tl,
				  scrub: true,
				  // markers: true,
				
				  onUpdate: function(self) {
					const totalItems = $(".section6 .list").length;
					const newIndex = Math.floor(self.progress * totalItems);
				
					if (newIndex < 0 || newIndex >= totalItems) return;
				
					if (currentIndex !== newIndex) {
						currentIndex = newIndex;
					  
						$(".section6 .list").each((index, element) => {
						  const offset = index - currentIndex;
						  const rotation = offset * rotationPerItem;
						  const isVisible = Math.abs(rotation) <= 90;
					  
						  gsap.to(element, {
							opacity: isVisible ? 1 - Math.abs(offset) * 0.2 : 0,
							visibility: isVisible ? "visible" : "hidden",
							pointerEvents: isVisible ? "auto" : "none",
							duration: 0.3
						  });
					  
						  // active 클래스 토글
						  if (index === currentIndex) {
							$(element).addClass("active");
						  } else {
							$(element).removeClass("active");
						  }
						});
					  
						// 현재 인덱스에 맞는 이미지 src 변경
						const currentList = $(".section6 .list").eq(currentIndex);
						const imgSrc = currentList.attr("data-src");
					  
						if(imgSrc) {
						  $("._cursor img").attr("src", imgSrc);
						}
					}					  
				  }
				});				
		} else {
			gsap.set('.listBx .list', { 
				opacity: 0, 
				y: 50 
			});
			
			// 리스트 아이템 애니메이션
			ScrollTrigger.batch('.listBx .list', {
				start: "top 80%",
				end : "top 80%",
				toggleActions: "play none none reverse",
				// markers: true,

				onEnter: (elements) => {
					gsap.to(elements, {
						opacity: 1,
						y: 0,
						duration: 0.5,
						stagger: 0.2,
						ease: 'power2.out',
					});
				},
			});
		}
	}

	function section6init() {
		if (section6resize) {
			if (section6scrub !== undefined) {
				section6scrub.kill();
				section6scrub = undefined;
			}
			if (section6arry.length > 0) {
				section6arry.forEach(function (e) {
					e.kill();
				});
			}

			if (section6tl !== undefined) {
				section6tl.kill();

				let section6tl_children = section6tl.getChildren();

				section6tl_children.forEach(function (e) {
					e.targets().forEach(function (dom) {
						gsap.set(dom, { clearProps: "all" });
					});
				});

				section6tl = undefined;
			}

			gsap.set(".section6", { clearProps: "all" });
			gsap.set(".section7", { clearProps: "all" });
			gsap.set(".section6 .wrap", { clearProps: "all" });
			$(".section6 .list").each(function (i, e) {
				gsap.set(e, { clearProps: "all" });
			});

			section6set();
		} else {
			section6set();
		}

		section6resize = true;
	}

	if (document.querySelector('.section6')) section6init();

	// 커서
	$(window).mousemove(function (event) {
		let x = event.clientX;
		let y = event.clientY;
		$("._cursor").css({ left: `${x}px`, top: `${y}px` });
		$("._cursor2").css({ left: `${x}px`, top: `${y}px` });
	});

	// 섹션 6 마우스 이벤트
	$(".section6 .list").mouseenter(function () {
		if(isInSection($(this).closest('.section6'))) {
			$("._cursor").addClass("on");
			let imgSrc = $(this).attr("data-src");
			$("._cursor img").attr("src", imgSrc);
			$('.theBall-outer').css('display', 'none');
		}
	}).mouseleave(function () {
		$("._cursor").removeClass("on");
		$('.theBall-outer').css('display', 'block');
	});

	// 스크롤 이벤트
	$(window).scroll(function() {
		// 섹션 6 체크
		if (!isInSection($('.section6'))) {
			$("._cursor").removeClass("on");
		}
		// 섹션 8 체크
		if (!isInSection($('.section8'))) {
			$("._cursor2").removeClass("on");
		}
	});

	// 섹션 내부인지 체크하는 함수
	function isInSection($section) {
		if (!$section.length) return false;

		const sectionTop = $section.offset().top;
		const sectionBottom = sectionTop + $section.outerHeight();
		const scrollTop = $(window).scrollTop();
		const windowHeight = $(window).height();
		const scrollBottom = scrollTop + windowHeight;

		return (scrollTop < sectionBottom && scrollBottom > sectionTop);
	}

	/*
	| ----------------------------------------------------------------------------------------
	| section7 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	let sec7Pt = $('.section7')
	gsap.timeline({
		scrollTrigger: {
			trigger: ".section7 .section-body",
			start: "center center",
			end: window.innerWidth > 768 ? "+=150%" : "+=100%",
			pin: true,
			scrub: 1,
			anticipatePin: 1,
			invalidateOnRefresh: true,
			// markers: true,
		}
	})
	.to(".section7 .img-area", {
		y: "-120%",
		ease: "none",
		duration: 2
	});

	gsap.timeline({
		scrollTrigger: {
			trigger: '.section7 .tit-area',
			start: 'top bottom',
			toggleActions: 'play none none reverse',
			anticipatePin: 1,
			// markers: true,
		}
	})
	.from('.section7 .img-area', {
		opacity: 0,
		y: 100,
		duration: 1,
		ease: 'power2.out'
	})
	.from('.section7 .tit-box b, .section7 .tit-box h3', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out',
	})
	.from('.section7 .tit-box p', {
		opacity: 0,
		y: 50,
		duration: 0.5,
		ease: 'power2.out',
		onComplete: function() { 
			startTextAnimation('.section7');
		}
	});
	/*
	| ----------------------------------------------------------------------------------------
	| section8 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	// ani_items 애니메이션
	gsap.fromTo('.section8 .ani_items', 
		{ opacity: 0, y: 50 },
		{
			opacity: 1,
			y: 0,
			duration: 0.3, // 애니메이션 시간 명시
			ease: 'power2.out',
			scrollTrigger: {
				trigger: ".section8",
				start: "top 50%",
				toggleActions: "play none none reverse",
			},
			onComplete: () => {
				// ani_items 애니메이션 완료 후 story-list 애니메이션 시작
				gsap.to('.story-list li', {
					opacity: 1,
					y: 0,
					duration: 0.5,
					stagger: 0.2,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: '.story-list',
						start: "top 45%",
						toggleActions: "play none none reverse"
					}
				});
			}
		}
	);

	// story-list 초기 상태 설정
	gsap.set('.story-list li', { 
		opacity: 0, 
		y: 50 
	});

	if(window.innerWidth > 1024) {
		// section8이 top에 도달하면 고정되고 story-list만 위로 올라가는 애니메이션
		const lastItem = document.querySelector(".section8 .story-list .story-item:last-child");
		const titArea = document.querySelector(".section8 .tit-area");

		gsap.to(".section8 .list-column", {
			scrollTrigger: {
				trigger: ".section8 .section-row",   // 스크롤 트리거 요소
				start: "top top",       // 트리거 시작점 (요소의 top과 화면의 top이 맞닿을 때)
				end: () => {
					// tit-area와 마지막 story-item의 bottom이 만나는 지점 계산
					const titAreaHeight = titArea.offsetHeight;
					const listColumnHeight = lastItem.getBoundingClientRect().bottom - titArea.getBoundingClientRect().top;
					return `+=${listColumnHeight - titAreaHeight}px`;
				},
				scrub: true,            // 부드러운 스크롤 애니메이션
				pin: titArea,       // 고정할 요소
				pinSpacing: false       // 고정 중 공간 차지 여부
			}
		});

		// 섹션 8 마우스 이벤트
		$(".section8 .story-list .story-item").mouseenter(function () {
			if(isInSection($(this).closest('.section8'))) {
				let imgSrc = $(this).attr("data-src");
				// data-src가 존재하고 값이 있을 때만 이미지 표시
				if (imgSrc && imgSrc.trim() !== '') {
					$("._cursor2").addClass("on");
					$("._cursor2 img").attr("src", imgSrc);
					$('.theBall-outer').css('display', 'none');
				}
			}
		}).mouseleave(function () {
			$("._cursor2").removeClass("on");
			$('.theBall-outer').css('display', 'block');
		});
	};

	/*
	| ----------------------------------------------------------------------------------------
	| section9 애니메이션 함수
	| ----------------------------------------------------------------------------------------
	*/
	
	gsap.timeline({
		scrollTrigger: {
			trigger: '.section9 .tit-area', // `.section9` 기준으로 트리거 설정
			start: 'top 70%',
			toggleActions: 'play none none reverse',
			// markers: true,
		}
	}).from('.section9 .tit-box b, .section9 .tit-box h3', {
		opacity: 0,
		y: 100,
		duration: 0.5,
		ease: 'power2.out'
	}).from('.section9 .tit-box p', {
		opacity: 0,
		y: 50,
		duration: 0.5,
		ease: 'power2.out',
		onComplete: function() { 
			startTextAnimation('.section9');
		}
	});

	// 초기 상태 설정
    gsap.set('.portfolio-list li, .btnSet', {
        opacity: 0,
        y: 50
    });
    
    ScrollTrigger.batch('.portfolio-list li', {
        start: "top 95%",
        toggleActions: "play none none reverse",
        // markers: true,
        onEnter: (batch) => {
            // 960px 미만에서만 on 클래스 추가
            if (window.innerWidth < 960) {
                setTimeout(() => {
                    batch.forEach(item => {
                        item.classList.add('on');
                    }, "-=0.2");
                }, 300);
            }
    
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to('.btnSet', {
                        opacity: 1,
                        y: 0,
                        duration: 0.3,
                        delay: 0.2,
                        ease: 'power2.out'
                    });
                }
            });
        },
        onLeaveBack: (batch) => {
            // 960px 미만에서만 on 클래스 제거
            if (window.innerWidth < 960) {
                batch.forEach(item => {
                    item.classList.remove('on');
                }, "-=0.2");
            }
    
            gsap.to(batch, {
                opacity: 0,
                y: 50,
                duration: 0.4,
                stagger: {
                    each: 0.1,
                    from: "end" // ✅ 사라질 때는 역순으로
                },
                ease: 'power2.in'
            });
    
            gsap.to('.btnSet', {
                opacity: 0,
                y: 50,
                duration: 0.4,
                ease: 'power2.in'
            });
        }
    });

	// 섹션9 애니메이션
	let ww = $(window).width();
	let wh = $(window).height();
	let scrollDown;
	let section9ListLength = $(".section9 .list").length;
	let section9tl;
	let section9scrub;
	let section9resize = false;
	let section9arry = [];

	function section9set() {
		if (ww > 960) {
			const listBxH = $(".section9 .listBx").height();
			const totalItems = $(".section9 .list").length;
			const visibleItems = totalItems;
			const rotationPerItem = 360 / totalItems;
			const zDistance = "calc(340/60*1em)";

			const scrollHeight = Math.max(wh, totalItems * 80);
			gsap.set(".section9 .wrap", { opacity: 1 });

			$(".section9 .list").each((index, element) => {
				const offset = -((index - totalItems + visibleItems) % totalItems);
				const rotation = offset * rotationPerItem;
				
				const isVisible = Math.abs(rotation) <= 90;
				
				gsap.set(element, {
					transform: `rotateX(${rotation}deg) translate3d(0,0,${zDistance})`,
					opacity: isVisible ? (1 - Math.abs(offset) * 0.2) : 0,
					pointerEvents: isVisible ? "auto" : "none",
					visibility: isVisible ? "visible" : "hidden"
				});
			});

			section9tl = gsap
				.timeline({
					defaults: { ease: "none" }
				})
				.to(".section9 .listBx", { 
					rotateX: rotationPerItem * totalItems,
					duration: 1,
					ease: "none"
				});

			let currentIndex = 0;
			
			section9scrub = ScrollTrigger.create({
				trigger: ".section9 .wrap",
				start: "center center",
				end: `+=${scrollHeight}`,
				pin: true,
				animation: section9tl,
				scrub: true,
				onUpdate: function(self) {
					const newIndex = Math.floor(self.progress * totalItems) % totalItems;
					
					if (currentIndex !== newIndex) {
						currentIndex = newIndex;
						
						$(".section9 .list").each((index, element) => {
							const offset = (index - currentIndex + totalItems) % totalItems;
							const adjustedOffset = offset > totalItems/2 ? offset - totalItems : offset;
							const rotation = adjustedOffset * rotationPerItem;
							const isVisible = Math.abs(rotation) <= 90;
							
							gsap.to(element, {
								opacity: 1,
								visibility: isVisible ? "visible" : "hidden",
								pointerEvents: isVisible ? "auto" : "none",
								duration: 0.3
							});
						});
					}
				}
			});
		} else {
			gsap.set('.listBx .list', { 
				opacity: 0, 
				y: 50 
			});
			
			ScrollTrigger.batch('.listBx .list', {
				start: "top 80%",
				end : "top 80%",
				toggleActions: "play none none reverse",
				onEnter: (elements) => {
					gsap.to(elements, {
						opacity: 1,
						y: 0,
						duration: 0.5,
						stagger: 0.2,
						ease: 'power2.out',
					});
				},
			});
		}
	}

	function section9init() {
		if (section9resize) {
			if (section9scrub !== undefined) {
				section9scrub.kill();
				section9scrub = undefined;
			}
			if (section9arry.length > 0) {
				section9arry.forEach(function (e) {
					e.kill();
				});
			}

			if (section9tl !== undefined) {
				section9tl.kill();
				let section9tl_children = section9tl.getChildren();
				section9tl_children.forEach(function (e) {
					e.targets().forEach(function (dom) {
						gsap.set(dom, { clearProps: "all" });
					});
				});
				section9tl = undefined;
			}

			gsap.set(".section9", { clearProps: "all" });
			gsap.set(".section9 .wrap", { clearProps: "all" });
			$(".section9 .list").each(function (i, e) {
				gsap.set(e, { clearProps: "all" });
			});

			section9set();
		} else {
			section9set();
		}

		section9resize = true;
	}

	section9init();

	// 섹션9 마우스 이벤트
	$(".section9 .list").mouseenter(function () {
		if(isInSection($(this).closest('.section9'))) {
			$("._cursor").addClass("on");
			let imgSrc = $(this).attr("data-src");
			$("._cursor img").attr("src", imgSrc);
			$('.theBall-outer').css('display', 'none');
		}
	}).mouseleave(function () {
		$("._cursor").removeClass("on");
		$('.theBall-outer').css('display', 'block');
	});
});

// 포트폴리오 토글 기능 (jQuery)
$(document).ready(function() {
    // 모바일 화면에서만 작동하도록 설정
    if ($(window).width() <= 480) {
        const $moreBtn = $('.more-portfolio');
        const $hiddenItems = $('.portfolio-item.hidden-mobile');
        const $toggleIcon = $('.toggle-icon');
        
        // 초기 상태 설정
        $hiddenItems.hide();
        
        // 버튼 클릭 이벤트
        $moreBtn.on('click', function(e) {
            e.preventDefault();
            
            const isExpanded = $(this).hasClass('active');
            
            // 숨겨진 아이템 토글
            $hiddenItems.slideToggle(300);
            
            // 버튼 상태 변경
            $(this).toggleClass('active');
            
            // 버튼 텍스트 변경
            if (isExpanded) {
                $(this).find('span').text('포트폴리오 더보기');
                $toggleIcon.css('transform', 'rotate(0deg)');
            } else {
                $(this).find('span').text('포트폴리오 접기');
                $toggleIcon.css('transform', 'rotate(-90deg)');
            }
        });
    }
});

function cloneFirstVisualText(){
	if($('.visual-inner > .visual-title').length > 0) return;
	const selector = $('.visual-swiper .swiper-slide-active').length > 0 ? '.visual-swiper .swiper-slide-active .visual-title' : '.visual-swiper .swiper-slide:first-child .visual-title';
	const firstVisualText = $(selector).clone();
	$(".visual-inner").prepend(firstVisualText);
	$(selector).css('opacity', 0);
}
