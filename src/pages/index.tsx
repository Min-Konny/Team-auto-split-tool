import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Button,
  Link,
  Center,
} from '@chakra-ui/react'
import NextLink from 'next/link'

export default function Home() {
  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Center>
          <VStack spacing={4}>
            <Heading size="2xl">LoL Team Maker</Heading>
            <Text fontSize="xl" textAlign="center">
              League of Legendsのチーム自動振り分けツール
            </Text>
          </VStack>
        </Center>

        <Card size="lg" variant="elevated" mb={6}>
          <CardHeader>
            <Heading size="lg">チーム作成</Heading>
          </CardHeader>
          <CardBody display="flex" flexDirection="column">
            <Text mb={4} fontSize="lg">
              プレイヤーを選択してチームを自動振り分けします。
              レートに基づいて最適なチーム分けを行い、各プレイヤーの希望ロールを考慮します。
            </Text>
            <NextLink href="/team-maker" passHref>
              <Button as={Link} colorScheme="purple" size="lg" width="100%">
                チーム作成へ
              </Button>
            </NextLink>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card height="100%">
            <CardHeader>
              <Heading size="md">プレイヤーリスト</Heading>
            </CardHeader>
            <CardBody display="flex" flexDirection="column">
              <Text mb={4} flex="1">
                登録済みのプレイヤーリストを表示します
              </Text>
              <NextLink href="/players" passHref>
                <Button as={Link} colorScheme="blue" width="100%">
                  プレイヤーリストへ
                </Button>
              </NextLink>
            </CardBody>
          </Card>

          <Card height="100%">
            <CardHeader>
              <Heading size="md">プレイヤー登録</Heading>
            </CardHeader>
            <CardBody display="flex" flexDirection="column">
              <Text mb={4} flex="1">
                新しいプレイヤーを登録します
              </Text>
              <NextLink href="/players/new" passHref>
                <Button as={Link} colorScheme="green" width="100%">
                  プレイヤー登録へ
                </Button>
              </NextLink>
            </CardBody>
          </Card>

          <Card height="100%">
            <CardHeader>
              <Heading size="md">試合履歴</Heading>
            </CardHeader>
            <CardBody display="flex" flexDirection="column">
              <Text mb={4} flex="1">
                過去の試合結果を確認できます
              </Text>
              <NextLink href="/matches" passHref>
                <Button as={Link} colorScheme="orange" width="100%">
                  試合履歴へ
                </Button>
              </NextLink>
            </CardBody>
          </Card>
        </SimpleGrid>

      </VStack>
    </Container>
  )
} 