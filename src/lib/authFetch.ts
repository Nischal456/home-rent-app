export const authFetch = async (url: string, token: string | null, options: RequestInit = {}) => {
    if (!token) {
        throw new Error("Authentication token is missing. Please log in again.");
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
};