import React, { useState, useEffect } from 'react';
import { useMoralis, useMoralisCloudFunction, useMoralisWeb3Api } from 'react-moralis';
import { Box, Stack } from '@chakra-ui/layout';
import {
  Skeleton, CloseButton, HStack, Badge, ButtonGroup, Button,
  Alert, AlertIcon, AlertTitle, Heading, Image, Flex, Link, Text, Tooltip
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import ShortAddress from 'UtilComps/ShortAddress';
import SkeletonLoadingList from 'UtilComps/SkeletonLoadingList';
import { CHAIN_TOKEN_SYMBOL, OPENSEA_CHAIN_NAMES, CHAIN_NAMES, CHAIN_TX_VIEWER, CHAINS } from 'libs/util';
import { sleep, buyOnOpenSea, contractsForChain } from 'libs/util';
import { useChainMeta } from 'store/ChainMetaContext';

export default function() {
  const { chainMeta: _chainMeta, setChainMeta } = useChainMeta();
  const { user } = useMoralis();
  const { web3 } = useMoralis();
  const Web3Api = useMoralisWeb3Api();
  
  const { isInitialized, Moralis } = useMoralis();
  const [onChainNFTs, setOnChainNFTs] = useState(null);
  const [oneNFTImgLoaded, setOneNFTImgLoaded] = useState(false);
  const [noData, setNoData] = useState(false);

  const {
    error: cfErr_getUserDataNFTCatalog,
    fetch: cf_getUserDataNFTCatalog,
    data: usersDataNFTCatalog,
  } = useMoralisCloudFunction('getAllDataNFTs', {
    ethAddress: user.get('ethAddress'),
    networkId: _chainMeta.networkId,
    myOnChainNFTs: onChainNFTs
  }, { autoFetch: false });  

  useEffect(() => {
    console.log('MOUNT MyDataNFTs');
  }, []);

  useEffect(() => {
    async function getOnChainNFTs () {
      const myNFTs = await Web3Api.account.getNFTs({
        chain: CHAIN_NAMES[_chainMeta.networkId]
      });

      console.log('🚀 ~ getOnChainNFTs ~ myNFTs', myNFTs);

      setOnChainNFTs(myNFTs.result);
    }

    if (isInitialized) {
      getOnChainNFTs();
    }
  }, [isInitialized, Moralis]);

  useEffect(() => {
    console.log('onChainNFTs');
    console.log(onChainNFTs);

    if (onChainNFTs !== null) {
      // we now have all data to call the CF
      cf_getUserDataNFTCatalog();      
    }
  }, [onChainNFTs]);

  useEffect(() => {
    (async() => {
      console.log('usersDataNFTCatalog');
      console.log(usersDataNFTCatalog);

      if (usersDataNFTCatalog && usersDataNFTCatalog.length === 0) {
        await sleep(5);
        setNoData(true);
      }
    })();
  }, [usersDataNFTCatalog]);

  const buyOrderSubmit = () => {
    console.log('buyOrderSubmit');
  }

  console.log('usersDataNFTCatalog', usersDataNFTCatalog);

  return (
    <Stack spacing={5}>
      <Heading size="lg">Data NFT Marketplace</Heading>
      <Heading size="xs" opacity=".7">Browse, View and Buy Cross-Chain Data NFTs</Heading>

      {cfErr_getUserDataNFTCatalog && 
        <Alert status="error">
          <Box flex="1">
            <AlertIcon />
            <AlertTitle>{cfErr_getUserDataNFTCatalog.message}</AlertTitle>
          </Box>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      }

      {(!usersDataNFTCatalog || usersDataNFTCatalog && usersDataNFTCatalog.length === 0) &&
        <>{!noData && <SkeletonLoadingList /> || <Text>No data yet...</Text>}</> ||
          <Flex wrap="wrap" spacing={5}>

          {usersDataNFTCatalog && usersDataNFTCatalog.map((item) => <Box key={item.id} maxW="xs" borderWidth="1px" borderRadius="lg" overflow="wrap" mr="1rem" w="250px" mb="1rem">
            <Flex justifyContent="center">
              <Skeleton isLoaded={oneNFTImgLoaded}>
                <Image src={item.nftImgUrl} alt={item.dataPreview} mt="1rem" onLoad={() => setOneNFTImgLoaded(true)} w={200} borderRadius="md" />
              </Skeleton>
            </Flex>

            <Flex p="3" direction="column" justify="space-between" height="360px">
              <Box
                fontSize="sm"
                mt="1"
                fontWeight="semibold"
                as="h4"
                lineHeight="tight">
                {item.nftName}
              </Box>

              <Box flexGrow="1">
                <Box as="span" color="gray.600" fontSize="sm">
                  {`${item.feeInMyda} ${CHAIN_TOKEN_SYMBOL(_chainMeta.networkId)}`}
                </Box>
              </Box>

              <Box mt="5">  
                <Text fontSize="sm">For Trade on <Badge borderRadius="full" px="2" colorScheme="teal">{CHAINS[item.txNetworkId]}</Badge></Text>

                <HStack mt="5">
                  <Text fontSize="xs">Seller: </Text>
                  <ShortAddress address={item.sellerEthAddress} />
                </HStack>

                <HStack mt=".5">
                  <Text fontSize="xs">Mint TX: </Text>
                  <ShortAddress address={item.txHash} />
                  <Link href={`${CHAIN_TX_VIEWER[item.txNetworkId]}${item.txHash}`} isExternal><ExternalLinkIcon mx="2px" /></Link>
                </HStack>

                {OPENSEA_CHAIN_NAMES[item.txNetworkId] &&
                  <ButtonGroup colorScheme="teal" spacing="3" size="sm" mt="5">
                    <Button isLoading={false} onClick={() => buyOnOpenSea(item.txNFTId, contractsForChain(item.txNetworkId).dnft, item.txNetworkId)}>Buy on OpenSea</Button>
                    {(item.txNetworkId === _chainMeta.networkId) && <Button display="none" isLoading={false}  onClick={() => buyOrderSubmit(item.id)}>Buy Now</Button>}
                  </ButtonGroup>}
              </Box>              
            </Flex>
          </Box>)}
          
          
        </Flex>
      }
    </Stack>
  );
};
