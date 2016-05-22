   //除chrome外，其他支持需要在服务器上运行才支持
	if(!window.localStorage){
	 	alert('This browser does NOT support localStorage');
	}

	/*
	 * config 奖项设置
	 * localStorage 存储设置
	 * board面板计奖函数
	 */
	var config = {
		'awards' : 'grateful',
		'keycode': {
			'49': { 'class': 'first',    'name': '一等奖', 'total': 1 },
			'50': { 'class': 'second',   'name': '二等奖', 'total': 2 },
			'51': { 'class': 'third',    'name': '三等奖', 'total': 3 },
			'52': { 'class': 'grateful', 'name': '感恩奖', 'total': 10 }
		},


		get: function( key ) {
			return window.localStorage.getItem( key ) || ''
		},

		set: function( key, val) {
			window.localStorage.setItem( key, val );
		},

		/*
		 *移除选定某项
		 *去2个以上','  去前后','
		 */
		remove: function( key, val ) {
			var key = key || config.awards,
				newval = config.get(key).replace(val, '').replace(/,{2,}/g, ',').replace(/(^,*)|(,*$)/g, '');

			config.set( key,  newval );
		},

		//获取当前locals
		getCur: function() {
			return config.get( config.awards )
		},

		//追加并去掉前后','
		setCur: function( val ) {
			var oldval = config.getCur(),
				newval = [ oldval, val ].join(',').replace(/(^,*)|(,*$)/g, '');

			config.set( config.awards, newval);
		},

		//查询当前是否有中奖记录！
		query: function( val ) {
			for(var key in window.localStorage){
				if( 'first|second|third|grateful'.indexOf(key) >= 0 ){
					return config.get( key ).indexOf(val) >= 0
				}
			}
			return false
		},

		//清空设置
		clear: function() {
			window.localStorage.clear()
		},

		//读取本地中奖数据
		reading: function() {
			for(key in config.keycode){
				var awards = config.keycode[key].class,
					locals = config.get(awards);

				if( !!locals ){
					var nums = locals.split(','),
						selector = $('.' + awards);
					
					for(var i = 0; i < nums.length; i++){
						config.appear( selector, nums[i] )
					}
				}
			}
		},

		appear: function( selector, num ) {
			var data  = dataSource[ num ],

				code  = selector.find('code'),
				ratio = code.html(),
				min   = ~~/(\d+)\/\d+/.exec(ratio)[1],
				max   = ~~/\d+\/(\d+)/.exec(ratio)[1];

			if( min == max ){
				var awards = selector.attr('class').split(/\s+/)[0],
					reg   = new RegExp('(\\d+,*){'+ max +'}');

				//过滤超过max位
				config.set(awards, reg.exec(config.get(awards))[0].replace(/(^,*)|(,*$)/g, '') )
				return
			}

			var newItem = selector.find('li:eq(0)').clone().removeAttr('class').attr({'data-num': num}).css({'margin-left': 300});

			newItem.find('.num').html( data[ 'tel' ].replace(data[ 'tel' ].substr(3, 4), '****') );
			newItem.find('.avatar img').attr('src', data[ 'url' ]);
			newItem.find('.name').html(data[ 'nick' ]);

			if( min > 0 ){
				newItem.prependTo( selector.find('.win') );
			} else {
				newItem.replaceAll( selector.find('li:eq(0)') )
			}

			setTimeout(function(){newItem.css({'margin-left': 0})}, 0)
			
			code.html( ratio.replace(/^\d+/, min + 1) );



			newItem.one('click', 'button', function() {
				var awards = newItem.parent().parent().parent('.active').attr('class').replace('active', '').replace(/^\s*|\s*$/g, '');

				config.remove( awards, newItem.data('num') );
				newItem.css({'transition-delay': 0, 'margin-left': 300});
				code.html( ratio.replace(/^\d+/, ~~/(\d+)\/\d+/.exec(code.html())[1] - 1) );

				setTimeout(function(){
					if( newItem.siblings().length == 0 ) {
						var none = newItem.clone().addClass('none').removeAttr('style');

						none.find('.num').html('***********');
						none.find('.avatar img').attr('src', 'img/blank.gif');
						none.find('.name').html('');	

						none.prependTo( selector.find('.win') )
					}

					newItem.remove()
				}, 600)
			})
		}
	}

	config['total'] = dataSource.length;

	/* 
     * 加载完毕后
	 */
	function loader() {
		$('#copyleft').fadeOut();
		$('#content, .trigger').addClass('active');


		//空格控制
		var action = $( '.counter ul:not(.none) li' ).filter(function( i ){ return i > 0 }),
			lock = true,
			boot = Lucky( action );

		$( document ).on('keydown.lazyloader', function( e ){

			if( e.keyCode == 32 ){//空格
				if( lock ){
					lock = boot.aStart();
				}else{
					lock = boot.lottery();

					console.log( $('.grateful li:not(.none)').length )
					//当删除未领奖的时候，默认启用一次抽一次
					config.awards == 'grateful' && taxis( $('.grateful li:not(.none)').length % 5 );
				}
			}
		})


		function taxis( i ) {
			var i = i || 0;

			setTimeout(function(){
				if( ++i < 5 ) {
					boot.aStart();
					boot.lottery();

					taxis( i );
				}
			}, 2500)
		}

	}

	function Lucky( args ){
		var args = args,
			timers = [],

			flicker = $('.flicker > img');

		return {
			//顺序运动
			aStart: function(){
				this.avatar();

				$.each(args, function( i, n ){
					var single = $( n );

					if( single.data( 'bingo' ) == undefined ){

						single.data( 'bingo',  Bingo( single ) );

					}
					
					timers[ i ] = setTimeout(function(){
						
						single.data( 'bingo' ).start();

					}, i * 150)
				});

				return !1;
			},

			/*
			 *抽奖
			 /^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}$/
			 
			 (new Date().getTime() * 9301 + 49297) % 233280 /233280.0 * Max

			 ~~(Math.random() * max)
			 ~~(Math.random() * (min - max + 1) + max)
			 ( new Date().getTime() * 7 - 13 ) % totalCount + 1

		     ~~(Math.random()*(max-min+1))

			 Math.round( Math.random() * 1000 + .5) 
		     Math.floor(Math.random() * 730) + 1

			 //数组排序  [].sort(function () { return 0.5 - Math.random(); })
			*/
			lottery: function() {
				for( var x in timers ) {
					try{
						if( timers.length > ~~x + 1 ) { 
							clearTimeout( timers[ x ] )
						}
					}catch(e){

					}
				}

				var lucky = this.randit();
					value = [];

				for(var i = 0; i < lucky.length; i++){
					( i > 0 && i < 3 || i > 6 ) && value.push( lucky.charAt( i ) )
				}
				
				$.each(args, function(i, n){
					var single = $( n ),
						bingo = single.data( 'bingo' );

					bingo.endTo( ~~value[ i ], i * 200, !i )
				})

				return !0;
			},

			/*
			 * 随机抽取！
			 */
			randit: function() {
				var result = Math.round( Math.random() * config.total + .5 ) - 1;
					tel = dataSource[ result ][ 'tel' ];

				if( config.query(result) ){
					return this.randit();
				}

				//html5存储序列号
				config.setCur( result );

				setTimeout(function(){
					//停止头像
					clearTimeout( timers[ args.length ] );

					flicker.attr('src', dataSource[ result ][ 'url' ]);

					config.appear( $('.' +  config.awards), result )
				}, 1000)

				return tel;
			},

			/*
			 * 头像变换！
			 */
			avatar: function() {
				var result = Math.round( Math.random() * config.total + .5 ) - 1;

					url = dataSource[ result ][ 'url' ];

				flicker.attr('src', url);

				timers[ args.length ] = setTimeout(arguments.callee, 100)
			}
		}
	}

	/*
	 * 摇奖机Bingo
	 * 从下至上循环摇动，控制backgroundPositionY
	 * arg $对象
	 */
	function Bingo( arg ) {
		var code = '3458', //网络识别号 [ 2 ]{ 3, 4, 5, 8 }
						   //RegExp( /^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}$/ )

			loop = 0,      //循环次数
			running = 0,   //0 - 9
			timer = null;  //控制摇动时间

		/*
		 * 增加随机步数selfAuto
		 * 保证每次跳跃次数不一致
		 * 范围 Math.random() * 10   --  [ 0 - 9 ]
		 */
		function selfAuto() {
			running += ~~( Math.random() * 10 );

			format();
		}

		/*
		 * 格式化format
		 * running 保持0-9区间
		 */
		function format() {
			if( running >= 10 ){
				loop ++;
				running -= 10;
			}
		}

		return {
			start: function() {
				selfAuto();

				arg.css({
					'background-position-y': -120 * ( 10 * loop + running )
				})

				//[50, 100]
				timer = setTimeout( arguments.callee, Math.random() * 50 + 50 )
			},

			stop: function(){
				clearTimeout( timer )
			},

			endTo: function( num, timer ) {
				this.stop();

				timer = timer || 200;

				//网络识别号 [ 2 ]{ 3, 4, 5, 8 }
				if( arguments[2] != undefined && arguments[2] ) {
					var to = code.indexOf( num ),
						from = ( 10 * loop + running ) % 4;
					
					if( to >= from ) {
						running += to - from;
					} else {
						running += 4 + to - from;
					}
					
					format();
				} else {
					if( num < running ) {
						loop ++;
					}
					running = num;
				}
				

				arg.animate({
					'background-position-y': -120 * ( 10 * loop + running  )
				}, timer)
			}
		}
	}

	$(document).ready(function() {
		var per = $('#loader .inner');

		$("#loader").addClass("ready");
		per.css('width', '100%');
		setTimeout(function() {
	        per.css('transform', 'scale(1, 1)')
	    }, 550);

	    setTimeout(function(){
	    	$("#loader").animate({'opacity': 0}, 'fast', function() { $(this).remove() });
			$('#copyleft').addClass('active');
	    }, 750);

		setTimeout(loader, 5000);

		$('.trigger').on('click', function(){
			if( !$(this).data('active') ){
				$('.zone-container').addClass('active');

				$('#content .counter-container').animate({'margin-left': -293}, 'fast');
				$('#content .flicker').animate({'margin-left': 100}, 'fast');

				$(this).data('active', true);
			} else {
				$('.zone-container').removeClass('active');

				$('#content .counter-container').animate({'margin-left': -443}, 'fast');
				$('#content .flicker').animate({'margin-left': -50}, 'fast');

				$(this).data('active', false);
			}
		});

		config.reading();

		/*
		 *更换壁纸、设置全局抽奖奖项
		 *键盘操作[1: 一等奖, 2: 二等奖, 3: 三等奖, 4: 感恩奖，0: 全显]
		 *CTRL + DEL 重置
		 */
		$( document ).on('keydown', function( e ) {
			var k = config.keycode[ e.keyCode ];
			if( !!k ) {
				config.awards = k.class;

				$('.' + config.awards).addClass('active').siblings().removeClass('active')

				//background

			} else if (e.keyCode == 48){
				config.awards = 'grateful';

				$('.board > div').addClass('active');
			} else if (e.ctrlKey && e.keyCode == 46) {

				config.clear();

				window.location.reload()
			}
		})

	})