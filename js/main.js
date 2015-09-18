(function() {

	angular.module("comicBrowser", ['ngRoute'])

	.factory("CtrlLoadingIcon", function($rootScope) {
		var loadingIcon = {};
		loadingIcon.show = false;

		loadingIcon.Show = function (value) {
			loadingIcon.show = value;
			$rootScope.$broadcast('SetLoadingStatus');
		};

		return loadingIcon;
	})

	.factory("CtrlImageView", ['$rootScope', '$location', function($rootScope, $location) {
		var viewService = {};
		viewService.tid = "";
		viewService.cid = "";
		viewService.nowKai = "";
		viewService.prevKai = "";
		viewService.nextKai = "";
		viewService.nowImage = 1;
		viewService.totalImgs = 0;

		viewService.PrevPage = function() {
			if (this.nowImage > 1)this.nowImage --;
			else alert("這是第一頁");
			this.ChangeImage();
		};

		viewService.NextPage = function() {
			if (this.nowImage < this.totalImgs)this.nowImage ++;
			else alert("這是最後一頁");
			this.ChangeImage();
		};

		viewService.ChangeImage = function() {
			$rootScope.$broadcast('ChangeImage');
		};

		viewService.PrevKai = function() {
			if (this.prevKai == null) {
				alert("這是第一回");
				return null
			}
			this.nowImage = 1;
			this.totalImgs = 0;
			$location.path("/comic/"+this.tid+"/"+this.cid+"/"+this.prevKai);
		};

		viewService.NextKai = function() {
			if (this.nextKai == null) {
				alert("這是最後一回");
				return null
			}
			this.nowImage = 1;
			this.totalImgs = 0;
			$location.path("/comic/"+this.tid+"/"+this.cid+"/"+this.nextKai);
		};

		viewService.KaiList = function() {
			$location.path("/comic/"+this.tid);
		};

		return viewService;
	}])

	.controller("BindKeyEvents", ['$scope', 'CtrlImageView', function($scope, imageView) {
		$scope.onKeyDown = function($event) {

			if ($event.ctrlKey) {
				if ($event.keyCode == 37) {
					imageView.PrevKai();
				}
				if ($event.keyCode == 39) {
					imageView.NextKai();
				}
			}
			else {
				if ($event.keyCode == 27) {
					imageView.KaiList ();
				}
				if ($event.keyCode == 37) {
					imageView.PrevPage ();
				}
				if ($event.keyCode == 39) {
					imageView.NextPage ();
				}
			}
		};
	}])

	.controller("BindButtonEvents", ['CtrlImageView', function(imageView) {
		this.GetTid = function() { return imageView.tid; }
		this.GetNowKai = function() { return imageView.nowKai; };
		this.NextKai = function() { imageView.NextKai(); };
		this.PrevKai = function() { imageView.PrevKai(); };
	}])

	.controller("GetComicList", ['$http', 'CtrlLoadingIcon', function($http, loadingIcon) {
		var controller = this;

		loadingIcon.Show(true);

		$http.get("/comicbrowserV2/js/comic.txt")
			.success(function(data) {
				controller.comicList = data;

				loadingIcon.Show(false);
			})
			.error(function(err) {
				console.log(err);
			});
	}])

	.controller("GetKaiList", ['$scope', '$http', '$routeParams', 'CtrlLoadingIcon', function($scope, $http, $routeParams, loadingIcon) {
		var controller = this;
		var kaiArr = [];
		var tid = $routeParams.tid;

		loadingIcon.Show(true);

		var url = "http://whateverorigin.org/get?url="+encodeURIComponent("http://comic.sfacg.com/HTML/"+tid+"/")+"&callback=?";
		$.getJSON(url, function(result) {
			var data = result.contents;
			var comic_id = data.match(/comicCounterID\s{0,}=\s{0,}([0-9]{1,})/)[1];
			var allKai = $(data).find("ul.serialise_list a");
			$.each(allKai, function(key, val) {
				var href = $(val).prop("href");
				var js_id = href.match(new RegExp (tid+"\\/([\\w-\\/.]*)\\/"))[1]; // TBP/RE01
				var kai = {};
				if(js_id.split("/").length == 2) {
					kai.pkid = js_id.split("/")[0]+"-"+js_id.split("/")[1]; // TBP-RE01
				}
				else {
					kai.kid = js_id;
				}
				kai.cid = comic_id;
				kai.text = $(val).text().trim();
				kaiArr.push(kai);
				if (key == allKai.length - 1) {
					// console.log(controller.kaiList)
					$scope.$apply(function(){
						controller.kaiList = kaiArr;
						controller.tid = tid;

						loadingIcon.Show(false);
					});
				}
			});
		});
	}])

	.controller("GetImageList", [ '$scope', '$http', '$routeParams', 'CtrlImageView', 'CtrlLoadingIcon', function($scope, $http, $routeParams, imageView, loadingIcon) {
		var controller = this;
		var imgArr = [];

		var tid = $routeParams.tid;
		var cid = $routeParams.cid;
		var pre, kid;
		if ($routeParams.kid.split("-").length == 2) {
			pre = $routeParams.kid.split("-")[0];
			kid = $routeParams.kid.split("-")[1];
		}
		else {
			kid = $routeParams.kid;
		}
		imageView.tid = tid;
		imageView.cid = cid;
		imageView.nowKai = kid;

		loadingIcon.Show(true);

		var url = "http://whateverorigin.org/get?url="+encodeURIComponent("http://comic.sfacg.com/Utility/"+cid+"/"+((pre!=null)?pre+"/":"")+kid+".js")+"&callback=?";
		$.getJSON(url, function(result) {
			eval(result.contents);
			var hostname = hosts[0];
			var nextArr = nextVolume.match(/^\/HTML\/\w{1,}\/(\w{1,})\/$/);
			var nextKai = (nextArr != null?nextArr[1]:null);
			var prevArr = preVolume.match(/^\/HTML\/\w{1,}\/(\w{1,})\/$/);
			var prevKai = (prevArr != null?prevArr[1]:null);
			$.each(picAy, function(key, val) {
				imgArr.push({ pid: key+1, url: hostname+val });
				if (key == picAy.length - 1) {
					// console.log(controller.imgList)
					$scope.$apply(function(){
						imageView.nextKai = nextKai;
						imageView.prevKai = prevKai;
						imageView.totalImgs = picCount;
						controller.nowImage = 1;
						controller.imgList = imgArr;
						controller.tid = tid;

						loadingIcon.Show(false);
					});
				}
			});
		});

		$scope.$on("ChangeImage", function() {
			controller.nowImage = imageView.nowImage;
		});

		this.isMobile = function() {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
				return true;
			else
				return false;
		};
	}])

	.controller("LoadingIcon", ['$scope', 'CtrlLoadingIcon', function($scope, loadingIcon) {
		var controller = this;
		controller.show = true;
		$scope.$on("SetLoadingStatus", function() {
			controller.show = loadingIcon.show;
		});
	}])

	.directive("resize", function ($window) {
		return function (scope, element) {
			var w = angular.element($window);
			scope.getWindowDimensions = function () {
				return {
					'h': w.height()
				};
			};
			scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
				scope.windowHeight = newValue.h;

				scope.style = function () {
						return {
							'height': (newValue.h - 70) + 'px'
						};
				};

			}, true);

			w.bind('resize', function () {
				scope.$apply();
			});
		}
	})

	.config(function($routeProvider) {
		$routeProvider
		.when("/", {
			templateUrl: "comicbrowserV2_comic.html"
		})
		.when("/comic/:tid", {
			templateUrl: "comicbrowserV2_kai.html"
		})
		.when("/comic/:tid/:cid/:kid", {
			templateUrl: "comicbrowserV2_read.html",
			controller: "BindKeyEvents"
		})
	});

})();
