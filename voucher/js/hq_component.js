// 전역 변수로 선언
let lenis = null;
const isMobile1 = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

$(function(){

    $("html, body").css({
        "scroll-behavior": "auto", // 데스크탑에서는 기본 스크롤 동작
        "overscroll-behavior": "auto" // 기본 overscroll 동작
    });

    // jarallax 초기화 (모바일/PC 모두)
    if ($(".jarallax").length > 0) {
        $(".jarallax").jarallax({});
    }

    // Lenis 스크롤 적용 (모바일 제외)
	if (!isMobile1) {
		const lenis = new Lenis({
			duration: 3,
			smooth: true,
		});
		window.lenis = lenis;

		// GSAP ScrollTrigger 플러그인 등록
		gsap.registerPlugin(ScrollTrigger);

		// ScrollTrigger와 Lenis 연동
		ScrollTrigger.scrollerProxy(document.body, {
			scrollTop(value) {
				if (arguments.length) {
					lenis.scrollTo(value, { immediate: true });
				} else {
					return window.scrollY;
				}
			},
			getBoundingClientRect() {
				return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
			},
			pinType: document.body.style.transform ? "transform" : "fixed",
		});

		// Lenis raf에서 jarallax와 ScrollTrigger 업데이트
		function raf(time) {
			lenis.raf(time);
			jarallax(document.querySelectorAll('.jarallax'), 'onScroll');
			ScrollTrigger.update(); // Lenis 스크롤 후 ScrollTrigger 상태 갱신
			requestAnimationFrame(raf);
		}
		requestAnimationFrame(raf);

		// Lenis 스크롤 이벤트에서 ScrollTrigger 갱신
		lenis.on('scroll', ScrollTrigger.update);

		// ScrollTrigger 새로고침
		ScrollTrigger.refresh();

		let isUserDragging = false;

		window.addEventListener('mousedown', (e) => {
			if (e.target === document.documentElement || e.target === document.body) {
				isUserDragging = true;
				// 드래그 시작 시 Lenis 애니메이션 중단
				if (lenis.stop) lenis.stop();
			}
		});
		window.addEventListener('mouseup', () => {
			if (isUserDragging) {
				// 드래그 끝나면 Lenis 위치를 즉시 동기화 + 애니메이션 재시작
				lenis.scrollTo(window.scrollY, { immediate: true });
				if (lenis.start) lenis.start();
				isUserDragging = false;
			}
		});
		window.addEventListener('touchstart', () => {
			if (lenis.stop) lenis.stop();
		});
		window.addEventListener('touchend', () => {
			lenis.scrollTo(window.scrollY, { immediate: true });
			if (lenis.start) lenis.start();
		});
	} else {
        // 모바일에서는 ScrollTrigger만 등록(필요시)
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.refresh();
    }


    /* Header */
    let lastScrollTop = 0;
    const $header = $('#header .header-body');
    const $subvisual = $('#sVisual .visual-nav.tab-wrap');
    const isMobile = $(window).width() <= 860;

	// header 스크롤 이벤트를 Lenis와 완전히 분리
    window.addEventListener('scroll', function() {
        const currentScrollTop = window.scrollY;
        const isVisualFixed = $('#sVisual.scroll-fixed').hasClass('fixed');
        
        // 이전 스크롤 위치와 현재 스크롤 위치를 비교하여 방향 결정
        if (currentScrollTop > lastScrollTop && currentScrollTop > 0) {
            // 아래로 스크롤 중일 때
            // if (!$('.mo-toggle').hasClass('active')) {
            //     $header.css('transform', 'translate3d(0, calc(-100% - 100px), 0)');
            // }
            
            // subvisual 처리
            if (isVisualFixed) {
                $subvisual.css('top', '100px');
            }
        } else if ((currentScrollTop < lastScrollTop || currentScrollTop === 0) && !isVisualFixed) {
            // 위로 스크롤 중이거나 최상단이고, visual이 고정되지 않았을 때만
            // if (!$('.mo-toggle').hasClass('active')) {
            //     $header.css('transform', 'translate3d(0, 0, 0)');
            // }
            
            // subvisual 처리
            $subvisual.css('top', '0');
        } else if (isVisualFixed) {
            // visual이 고정되어 있을 때는 헤더를 숨긴 상태로 유지
            // if (!$('.mo-toggle').hasClass('active')) {
            //     $header.css('transform', 'translate3d(0, calc(-100% - 100px), 0)');
            // }
        }
    
        // 현재 스크롤 위치 저장
        lastScrollTop = currentScrollTop;
    });

    // subvisual 고정 처리
    if ($('#sVisual.scroll-fixed').length > 0 && $('#sVisual.scroll-fixed .visual-nav').length > 0) {
        // visual-nav가 존재하는지 먼저 확인
        const $header = $('#header');
        const $visualNav = $('#sVisual.scroll-fixed .visual-nav');
        
        // 초기 offset 계산
        let navOffset = $visualNav.offset().top - $header.innerHeight();

        // 리사이즈 시 offset 재계산
        $(window).on('resize', function() {
            navOffset = $visualNav.offset().top - $header.innerHeight();
        });

        $(window).scroll(function() {
            if ($(window).scrollTop() >= navOffset) {
                $('#sVisual.scroll-fixed').addClass('fixed');
            } else {
                $('#sVisual.scroll-fixed').removeClass('fixed');
            }
        });
    }

	var mobile = {
		leftOpen : function(){
			$('.mobile-inner').stop().animate({'right':'0'}, 400,'easeInOutQuad');
		},

		leftClose : function(){
			$('.mobile-inner').stop().animate({'right':'200%'}, 400, 'easeInOutQuad');
		},

		rightOpen : function(){
			$('.mobile-inner').stop().animate({'left':'0'}, 400,'easeInOutQuad');
		},

		rightClose : function(){
			$('.mobile-inner').stop().animate({'left':'200%'}, 400, 'easeInOutQuad');
		},

		slideOpen : function(){
			$('.mobile-inner').stop().slideDown(400,'easeInOutQuad');
		},

		slideClose : function(){
			$('.mobile-inner').stop().slideUp(400, 'easeInOutQuad');
		},

		showOpen : function(){
			$('.mobile-inner').stop().fadeIn(0, 'easeInOutQuad');
		},

		showClose : function(){
			$('.mobile-inner').stop().fadeOut(0, 'easeInOutQuad');
		},

		down : function(target){
			$(target).addClass('on');
			$(target).next().stop().slideDown(400,'easeInOutQuad');
			
		},

		up : function(target){
			$(target).removeClass('on');
			$(target).next().stop().slideUp(400, 'easeInOutQuad');
		},

		siblingsUp : function(target){
			$(target).parent().siblings('li').children('a').removeClass('on');
			$(target).parent().siblings('li').children('ul').stop().slideUp(400, 'easeInOutQuad');
		},

		bgOn : function(){
			$('.gnb_bg').stop().fadeIn(400);
		},

		bgOff : function(){
			$('.gnb_bg').stop().fadeOut(400);
		}
	}	

	$('.header-nav.dropdown-mega .depth1').on({
		mouseenter : function(){
            $('.gnb_bg').stop().fadeIn(400);
			$('.dep_bg').stop().slideDown(400);
            $(this).find('.depth2').stop().slideDown(400);
		},
		mouseleave : function(){
            $('.gnb_bg').stop().fadeOut(400);
			$('.dep_bg').stop().slideUp(400);
            $(this).find('.depth2').stop().slideUp(400);
		}
	});

	$('.header-nav.dropdown-mine .depth1 > li').on({
        mouseenter: function() {
            $(this).find('.depth2')
            .stop(true, true)  // 큐에 쌓인 모든 애니메이션 제거
            .css('display', 'flex')
            .hide()
            .slideDown({
                duration: 400,
                start: function() {
                    $(this).css('display', 'flex');
                }
            });
        },
        mouseleave: function() {
            $(this).find('.depth2')
            .stop(true, true)  // 큐에 쌓인 모든 애니메이션 제거
            .slideUp({
                duration: 400,
                complete: function() {
                    $(this).css('display', 'none');
                }
            });
        }
    });

	$('.mo-toggle').on('click', function(){
		$('.mo-toggle').toggleClass('active');
        $('.header-inner').toggleClass('on');
		if( $(this).hasClass('active') ) {
			if( $('.mobile-inner').hasClass('left-move') ) {
				mobile.leftOpen();
			} else if( $('.mobile-inner').hasClass('right-move') ) {
				mobile.rightOpen();
			} else if( $('.mobile-inner').hasClass('slide-move') ) {
				mobile.slideOpen()
                // $('.theBall-outer .theBall1').addClass('bl');
                $('body').css('overflow', 'hidden');
                lenis.stop(); // Lenis 비활성화
			} else if( $('.mobile-inner').hasClass('show-move') ) {
				mobile.showOpen()
			}
			mobile.bgOn();
		} else {
			if( $('.mobile-inner').hasClass('left-move') ) {
				mobile.leftClose();
			} else if( $('.mobile-inner').hasClass('right-move') ) {
				mobile.rightClose();
			} else if( $('.mobile-inner').hasClass('slide-move') ) {
				mobile.slideClose()
                // $('.theBall-outer .theBall1').removeClass('bl');
                $('body').css('overflow', 'auto');
                lenis.start(); // Lenis 활성화
			} else if( $('.mobile-inner').hasClass('show-move') ) {
				mobile.showClose()
			}
			mobile.bgOff();
		}
	});

	$('.mobile-inner .depth1 > li > a').on('click',function(){
		mobile.siblingsUp(this);
		if($(this).hasClass('on')){
			mobile.up(this);
		}else{
			mobile.down(this);
		}
	});

	/* quick 버튼 관련 -- 시작 */
	// $(function() {
	// 	var $window = $(window);
	// 	var $app = $('.wrapper');
	// 	var $topbutton = $('.quick');
	// 	var $footer = $('footer');
		
	// 	function updateButtonPosition() {
	// 		var st = $window.scrollTop();
	// 		var target = $app.outerHeight() - $footer.outerHeight() - $window.height();
			
	// 		if (st >= target) {
	// 			var bottomSpacing = window.innerWidth <= 768 ? 20 : 30;
	// 			$topbutton.css({
	// 				'position': 'absolute',
	// 				'bottom': ($footer.outerHeight() + bottomSpacing) + 'px'
	// 			});
	// 		} else {
	// 			var bottomSpacing = window.innerWidth <= 768 ? 20 : 30;
	// 			$topbutton.css({
	// 				'position': 'fixed',
	// 				'bottom': bottomSpacing + 'px'
	// 			});
	// 		}
	// 	}

	// 	$window.on('scroll', updateButtonPosition);
	// 	$window.on('resize', updateButtonPosition);
	// });
	/* quick 버튼 관련 -- 끝 */
	
	/* subVisual */
	$('.visual-nav .nav-menu > a').on('click', function(){
		if($(this).hasClass('on')){
			$(this).removeClass('on');
			$(this).next().stop().slideUp();
		}else{
			$('.visual-nav .nav-menu > a').removeClass('on');
			$('.visual-nav .nav-menu > ul').stop().slideUp();
			$(this).addClass('on');
			$(this).next().stop().slideDown();
		}
	});

    /* Popup */
	// 팝업 외부 클릭 감지 및 닫기
	$(document).on('mouseup', function(e) {
        var popup = $(e.target).closest(".popup");
        if(popup.length > 0 && popup.find(".popup-inner").has(e.target).length === 0){
            var type = popup.attr('data-open-type') || 'normal';
            closePopup(popup, type);
        }
    });
	
	$('select:not(.ignore)').niceSelect(); 

	$('.top-btn').on('click', function(){
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
});


function openPopup(id, type){
    if(type == "normal"){
        $(id).attr('data-open-type', 'normal');
        $(id).show();        
        $('.popup-bg').show();
    }
    if(type == "fade"){
        $(id).attr('data-open-type', 'fade');
        $(id).fadeIn(200);
        $('.popup-bg').fadeIn(200);
    }

    $("html").css('overflow', 'hidden');
    // Lenis 스크롤 일시 중지
    lenis.stop();
}

// closePopup 함수
function closePopup(trigger, type) {
    // trigger가 버튼인 경우 해당 팝업을 찾음
    var popup = $(trigger).closest('.popup');

    if (popup.length === 0) return; // 닫을 팝업이 없으면 종료

    if (type === "normal") {
        popup.attr('data-open-type', 'normal');
        popup.hide();
        $('.popup-bg').hide();
    } else if (type === "fade") {
        popup.attr('data-open-type', 'fade');
        popup.fadeOut(200);
        $('.popup-bg').fadeOut(200);
    }

    $("html").css('overflow', 'auto');
    // Lenis 스크롤 재시작
    lenis.start();
}

function ppAlert(opts){
    var alertHTML = '';

    if ($('.pp-alert').length > 0) {
        $('.pp-alert').remove();
    }

    if (typeof opts == 'string') {
        var alertHTML = `
            <div id="alertModal" class="popup pp-alert small-modal" style="z-index:9999;">
                <div class="popup-body">
                    <div class="popup-inner">
                        <div class="popup-cont">
                            <div class="txt-box">
                                <p id="msg">${opts}</p>
                            </div>
                            <div class="btnSet">
                                <a href="javascript:;" class="btn btn-primary btn1 btn-lg">확인</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `
    } else {
        var alertHTML = `
        <div ${opts.id ? 'id="'+ opts.id +'"' : ''} class="popup pp-alert ${opts.button2 ? ' confirm' : ''} small-modal" style="z-index:9999;">
            <div class="popup-body">
                <div class="popup-inner">
                    <div class="popup-cont">
                        <div class="txt-box">
                            <p id="msg2">${opts.text}</p>
                        </div>
                        <div class="btnSet">
                            ${opts.button2 ? '<a href="javascript:;" class="btn btn-primary btn2 btn-lg">'+ opts.button2.text +'</a>' : ''}
                            ${opts.button1 ? '<a href="javascript:;" class="btn btn-cancel btn1 btn-lg">'+ opts.button1.text +'</a>' : '<a href="javascript:;" class="btn btn-primary btn1"확인</a>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
    }

    $('html').append(alertHTML);
    
    $('.pp-alert').css('display', 'block');

    // button 클릭
    $('.pp-alert .btn1').on('click', function(e){
        $('.pp-alert').css('display', 'none');
        if (opts.button1) {
            if (opts.button1.click) opts.button1.click(e);
        }
    });

    if (opts.button2) {
        $('.pp-alert .btn2').on('click', function(e){
            $('.pp-alert').css('display', 'none');
            if (opts.button2) {
                if (opts.button2.click) opts.button2.click(e);
            }
        });
    }
};

// 앵커로 스크롤 함수
$(document).ready(function() {
    // 서브비주얼 메뉴가 있을 때만 실행 (visual-inner 체크 제거)
    if ($('#sVisual .visual-nav.tab-wrap').length > 0) {
        // 스크롤 시 섹션의 위치 확인
        $(window).on('scroll', function() {
            let scrollPosition = $(window).scrollTop();
            let currentSection = ''; 

            $('.section').each(function() {
                var section = $(this);
                var id = section.attr('id');
                if (!id) return; // id가 없는 섹션은 건너뛰기

                var offsetTop = section.offset().top;
                var offsetBottom = offsetTop + section.outerHeight();

                if (scrollPosition >= offsetTop - 100 && scrollPosition < offsetBottom - 100) {
                    const $link = $('.visual-nav.tab-wrap a[href*="#' + id + '"]');
                    const $li = $link.parent();
                
                    $('.visual-nav.tab-wrap li').removeClass('on');
                    $li.addClass('on');
                
                    const $scrollBox = $('.depth1-box'); // overflow-x: auto가 걸린 요소
                    const liOffset = $li.offset().left;
                    const boxOffset = $scrollBox.offset().left;
                    const liWidth = $li.outerWidth();
                    const boxWidth = $scrollBox.outerWidth();
                    const scrollLeft = $scrollBox.scrollLeft();

                    const liCenter = liOffset - boxOffset + (liWidth / 2);
                    const scrollTo = scrollLeft + liCenter - (boxWidth / 2);

                    if ($scrollBox.get(0).scrollWidth > boxWidth) {
                        $scrollBox.stop().animate({ scrollLeft: scrollTo }, 300);
                    }
                    
                    currentSection = id;
                } else {
                    $('.visual-nav.tab-wrap a[href*="#' + id + '"]').parent().removeClass('on');
                }
            });

            // URL 변경 (히스토리 API 사용)
            if (currentSection) {
                const newUrl = window.location.pathname + '#' + currentSection;
                if (window.location.hash !== '#' + currentSection) {
                    history.replaceState(null, '', newUrl);
                }
            }
        });

        const headerHeight = $('#header').outerHeight();
        
        $('.smooth-scroll').on('click', function(e) {
            e.preventDefault();
            const href = $(this).attr('href');
            
            // href에 #이 있는 경우에만 스크롤 처리
            if (href && href.includes('#')) {
                const targetId = href.split('#')[1];
                const $target = $('#' + targetId);
                
                if ($target.length) {
                    const currentScroll = $(window).scrollTop();
                    const targetOffset = $target.offset().top;
                    let offsetPosition;

                    // visual-nav의 높이만 체크
                    const subvisualHeight = $('#sVisual .visual-nav').outerHeight() || 0;
                    
                    if (targetOffset < currentScroll) {
                        offsetPosition = targetOffset - (headerHeight + subvisualHeight);
                    } else {
                        offsetPosition = targetOffset - headerHeight;
                    }

                    // 진행 중인 모든 애니메이션 중지
                    $('html, body').stop(true, true);
                    
                    // Lenis 스크롤로 부드럽게 이동
                    if (lenis) {
                        lenis.scrollTo(offsetPosition, { 
                            duration: 0.8,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) // 부드러운 이징 함수
                        });
                    } else {
                        // Lenis가 초기화되지 않은 경우 일반 스크롤 사용
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }

                    // URL 업데이트
                    history.pushState(null, '', window.location.pathname + '#' + targetId);
                }
            } else {
                // #이 없는 경우 일반 링크로 처리
                window.location.href = href;
            }
        });
    }
});

// 호버 가능한 영역에 마우스 커서 추가
$(document).ready(function(){
    var isLargeScreen = window.innerWidth > 1024;
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var cursorX = mouseX;
    var cursorY = mouseY;

    // 기본 커서 숨기기
    $('body').css('cursor', 'none');
    $('.morecursor').css('cursor', 'none');

    // 초기 위치 설정
    gsap.set('.theBall-outer', {
        x: cursorX,
        y: cursorY,
        xPercent: -5,
        yPercent: -5
    });

    // 초기 상태: theBall1만 보이게
    gsap.set('.theBall1', { display: 'block' });

    // 부드러운 움직임을 위한 애니메이션
    gsap.ticker.add(() => {
        if (!isLargeScreen) return;

        cursorX += (mouseX - cursorX);
        cursorY += (mouseY - cursorY);

        gsap.set('.theBall-outer', {
            x: cursorX,
            y: cursorY
        });
    });

    $(document).mousemove(function(e) {
        if (!isLargeScreen) return;

        mouseX = e.pageX;
        mouseY = e.pageY - $(window).scrollTop();
    });		

    // cursor change
    $('.morecursor').on('mouseenter', function(){
        if (!isLargeScreen) return;
        $('.theBall-outer').addClass('on');
    }).on('mouseleave', function(){
        if (!isLargeScreen) return;
        $('.theBall-outer').removeClass('on');
    });

    $(window).resize(function() {
        isLargeScreen = window.innerWidth > 1024;
        if (!isLargeScreen) {
            $('body').css('cursor', 'auto');
            $('.morecursor').css('cursor', 'auto');
        } else {
            $('body').css('cursor', 'none');
            $('.morecursor').css('cursor', 'none');
        }
    });
});

// 공통 텍스트 애니메이션 함수
function startTextAnimation(sectionClass) {
    const textElements = document.querySelectorAll(`${sectionClass} .tit-box p span`);
    
    if(!textElements.length) return;  
    
    // 모든 span 요소에 fill-text 클래스 추가
    textElements.forEach(el => {
        el.classList.add('fill-text');
    });

    gsap.timeline({
        scrollTrigger: {
            trigger: sectionClass,
            start: 'top top',
            end: 'top top',
            scrub: 1,
            toggleActions: 'restart none none reset',
            // markers: true
        }
    }).to(textElements, {
        backgroundPosition: '0% 0',
        ease: "power1.inOut", // 부드러운 이징
        duration: 10,        // 더 긴 지속시간
        stagger: 5,         // 각 텍스트 요소 간 더 긴 간격
        onStart: function() {
            gsap.set(textElements, {
                visibility: 'visible',
                opacity: 1
            });
        }
    });
}

/*
| ----------------------------------------------------------------------------------------
| input custom에 따른 함수입니다.
| ----------------------------------------------------------------------------------------
*/
function handleInputValue(input) {
    input.classList[input.value.trim() === '' ? 'remove' : 'add']('has-value');
}

function clearInput(button) {
    const input = button.closest('.ipt-box').querySelector('input');
    input.value = '';
    input.classList.remove('has-value');
}

function handleInputBlur(input) {
    input.classList.toggle('has-value', input.value.trim() !== '');
}


/* 삭제하지 말것 */
String.prototype.replaceAll = function(org, dest) {
    return this.split(org).join(dest);
}

function refresh_captcha(){
	document.getElementById("capt_img").src="/include/captcha.php?waste="+Math.random(); 
	return false;
}


/* - - - - - - - - - */ 