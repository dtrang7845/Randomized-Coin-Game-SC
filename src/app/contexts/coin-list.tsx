// "use client";
// import React, { useState, useEffect, useMemo, useContext, createContext } from 'react'

// type GeckoCoinApiResponse = {
//     id: string;
//     symbol: string,
//     name: string,
// }

// const CoinContextAPI = createContext<GeckoCoinApiResponse[] | null>(null);

// export const CoinProvider = ({children}: {children: React.ReactNode}) => {
//     const [coinList, setCoinList] = useState<GeckoCoinApiResponse[] | null>(null);
//     const [isLoading, setIsLoading] = useState<boolean>(false)
//     useEffect(() => {
//         const fetchCoinData =  async () => {
//             setIsLoading(true)
//             const response = await fetch("https://api.coingecko.com/api/v3/coins/list");
//             const coinData: GeckoCoinApiResponse[] = await response.json()
//             setCoinList(coinData);
//         }
//         fetchCoinData();
//     }, [])
//     return(
//         <CoinContextAPI.Provider value={coinList}>
//             {children}
//         </CoinContextAPI.Provider>
//     );
// }

// export const useCoinList = () => {
//     const coinList = useContext(CoinContextAPI);
//     return coinList
    
// }

