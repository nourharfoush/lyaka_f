document.addEventListener('DOMContentLoaded', function() {
    // Get the region select dropdown and show button elements
    const regionSelect = document.getElementById('regionSelect');
    const showRegionBtn = document.getElementById('showRegionBtn');
    
    // Add click event listener to the show button
    if (showRegionBtn && regionSelect) {
        showRegionBtn.addEventListener('click', function() {
            const selectedRegionId = regionSelect.value;
            
            // Check if a region is selected
            if (selectedRegionId) {
                // Redirect to the region students report page with the selected region ID
                window.location.href = `/reports/region-students/${selectedRegionId}`;
            } else {
                // Alert the user to select a region first
                alert('الرجاء اختيار منطقة أولاً');
            }
        });
    }
});