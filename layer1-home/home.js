
window.initHome = function () {
    document
        .querySelectorAll('#home [data-placeholder]')
        .forEach(link => {
            link.addEventListener('click', event => {
                if (link.getAttribute('href') === '#') {
                    event.preventDefault();

                    window.portfolioNotify(
                        'Add your ' +
                        link.dataset.placeholder +
                        ' profile URL in layer1-home/home.html.'
                    );
                }
            });
        });
};
