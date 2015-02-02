//
// Prevent horizontal scroll for Back page in Mac 10.7+
//
// Mac OSX Lion introduces a nasty behavior: when you are scrolling and
// the element (or its parents) are no longer scrollable, then horizontal
// scrolling with two fingers will trigger back page or next page.
//
// For now this plugin provides a way to prevent that behavior for Chrome
// in the case you're scrolling up or left where you can't scroll anymore,
// which triggers back/next page.
//
// Supported browsers: Mac OSX Chrome
// On all other browsers this script won't do anything
//
// Depends on: jquery.mousewheel.js
//
// TODO: Add Mac OSX Safari support
//
//
// by Pablo Villalba for http://teambox.com
//

(function ($) {

  // This code is only valid for Mac
  if (!navigator.userAgent.match(/Macintosh/)) {
    return;
  }

  // Handle scroll events in Chrome
  if (navigator.userAgent.match(/Chrome/)) {

    // TODO: This only prevents scroll when reaching the topmost or leftmost
    // positions of a container. It doesn't handle rightmost or bottom,
    // and Lion scroll can be triggered by scrolling right (or bottom) and then
    // scrolling left without raising your fingers from the scroll position.
    $(window).mousewheel(function (e, d, x, y) {

      var prevent_left, prevent_up;

      // If none of the parents can be scrolled left when we try to scroll left
      prevent_left = x < 0 && !_($(e.target).parents()).detect(function (el) {
        return $(el).scrollLeft() > 0;
      });

      // If none of the parents can be scrolled up when we try to scroll up
      prevent_up = y > 0 && !_($(e.target).parents()).detect(function  (el) {
        return $(el).scrollTop() > 0;
      });

      // Prevent futile scroll, which would trigger the Back/Next page event
      if (prevent_left || prevent_up) {
        e.preventDefault();
      }
    });

  }

}(jQuery));
