export interface ScrapedVehicle {
    title: string;
    price: number | null;
    mileage: number | null;
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    description: string;
    images: string[];
    sourceUrl: string;
    conditionExterior?: string;
    conditionInterior?: string;
    conditionMechanical?: string;

    // Additional extracted fields
    transmission?: string;
    fuelType?: string;
    titleStatus?: string;
    exteriorColor?: string;
    location?: string;
}

export interface Scraper {
    /**
     * Returns true if this scraper can handle the given URL.
     */
    canHandle(url: string): boolean;

    /**
     * Scrapes the vehicle data from the given URL.
     * @throws Error if the vehicle cannot be scraped.
     */
    scrape(url: string): Promise<ScrapedVehicle>;
}
