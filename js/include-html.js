document.addEventListener("DOMContentLoaded", function() {
    // Function to include HTML content
    function includeHTML() {
        const includes = document.querySelectorAll('[data-include]');
        
        includes.forEach(element => {
            const file = element.getAttribute('data-include');
            
            fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error loading ${file}: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    // Extract only the content we need from the included HTML
                    // This removes the DOCTYPE, html, head, and body tags
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(html, 'text/html');
                    
                    // If it's a header or footer, get only the main content
                    if (file.includes('header.html')) {
                        // For header, extract only the header_section div
                        const headerSection = doc.querySelector('.header_section');
                        if (headerSection) {
                            element.innerHTML = headerSection.outerHTML;
                        } else {
                            element.innerHTML = html; // Fallback
                        }
                    } else if (file.includes('footer.html')) {
                        // For footer, extract only the footer_section div
                        const footerSection = doc.querySelector('.footer_section');
                        if (footerSection) {
                            element.innerHTML = footerSection.outerHTML;
                        } else {
                            element.innerHTML = html; // Fallback
                        }
                    } else {
                        // For other includes, use the body content
                        element.innerHTML = doc.body.innerHTML;
                    }
                    
                    // Execute any scripts in the included HTML
                    const scripts = element.querySelectorAll('script');
                    scripts.forEach(script => {
                        const newScript = document.createElement('script');
                        
                        if (script.src) {
                            newScript.src = script.src;
                        } else {
                            newScript.textContent = script.textContent;
                        }
                        
                        document.head.appendChild(newScript);
                        script.remove();
                    });
                })
                .catch(error => {
                    console.error(error);
                    element.innerHTML = `<p>Error loading ${file}</p>`;
                });
        });
    }
    
    // Run the include function
    includeHTML();
});
