import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import location from 'core/js/location';
import router from 'core/js/router';
import startController from 'core/js/startController';
import _ from 'underscore';

class NavigationView extends Backbone.View {

  className() {
    return 'nav';
  }

  events() {
    return {
      'click [data-event]': 'triggerEvent'
    };
  }

  attributes() {
    return {
      role: 'navigation'
    };
  }

  initialize() {
    _.bindAll(this, 'sortNavigationButtons');
    this.listenToOnce(Adapt, 'courseModel:dataLoading', this.remove);
    this.listenTo(Adapt, 'router:menu router:page', this.hideNavigationButton);
    this.preRender();
  }

  preRender() {
    Adapt.trigger('navigationView:preRender', this);
    this.render();
  }

  render() {
    const template = Handlebars.templates[this.constructor.template];
    this.$el.html(template({
      _config: Adapt.config.toJSON(),
      _globals: Adapt.course.get('_globals'),
      _accessibility: Adapt.config.get('_accessibility')
    })).insertBefore('#app');
    this.listenForInjectedButtons();
    _.defer(() => {
      Adapt.trigger('navigationView:postRender', this);
    });

    return this;
  }

  triggerEvent(event) {
    event.preventDefault();
    const currentEvent = $(event.currentTarget).attr('data-event');
    Adapt.trigger('navigation:' + currentEvent);
    switch (currentEvent) {
      case 'backButton':
        router.navigateToPreviousRoute();
        break;
      case 'homeButton':
        router.navigateToHomeRoute();
        break;
      case 'parentButton':
        router.navigateToParent();
        break;
      case 'skipNavigation':
        this.skipNavigation();
        break;
      case 'returnToStart':
        startController.returnToStartLocation();
        break;
    }
  }

  skipNavigation() {
    a11y.focusFirst('.' + location._contentType);
  }

  hideNavigationButton(model) {
    const shouldHide = (model.get('_type') === 'course');
    this.$('.nav__back-btn, .nav__home-btn').toggleClass('u-display-none', shouldHide);
  }

  listenForInjectedButtons() {
    this.observer = this.observer || new MutationObserver(this.sortNavigationButtons);
    this.observer.observe(this.$('.nav__inner')[0], {
      childList: true
    });
  }

  sortNavigationButtons() {
    this.observer.disconnect();
    const container = this.$('.nav__inner')[0];
    const items = [...container.children];
    items
      .sort((a, b) => parseFloat($(a).attr('data-order') || 0) - parseFloat($(b).attr('data-order') || 0))
      .forEach(item => container.appendChild(item));
    this.observer.takeRecords();
    this.listenForInjectedButtons();
  }

  showNavigationButton() {
    this.$('.nav__back-btn, .nav__home-btn').removeClass('u-display-none');
  }

}

NavigationView.template = 'nav';

export default NavigationView;
