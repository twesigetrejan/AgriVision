import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ListRenderItem } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; 
import { User } from 'lucide-react-native';
import { router } from 'expo-router';

interface Post {
    id: string;
    userName: string;
    postContent: string;
    imageUrl?: any; 
    likes: number;
    comments: number;
    source?: string;
}

const IndexPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
    const [loginButtonPressed, setLoginButtonPressed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
    const [profileImages, setProfileImages] = useState<{ [key: string]: string }>({});

    // Dummy posts
    const dummyPosts: Post[] = [
        {
            id: 'dummy1',
            userName: 'Twesige Trejan',
            postContent: 'New techniques in irrigation are changing the game.',
            imageUrl: require('../../assets/images/irri.jpg'),
            likes: 3,
            comments: 0,
            source: 'Agri Journal',
        },
        {
            id: 'dummy2',
            userName: 'Haven Ella',
            postContent: 'Just harvested my first crop of the season!.',
            imageUrl: require('../../assets/images/coffee.jpg'),
            likes: 10,
            comments: 0,
            source: 'Personal Farm',
        }
    ];

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const storedPosts = await AsyncStorage.getItem('posts');
                if (storedPosts) {
                    setPosts(JSON.parse(storedPosts));
                } else {
                    console.log('No posts found in AsyncStorage');
                }
            } catch (error) {
                console.error('Failed to load posts:', error);
            }
        };

        const loadProfileImages = async () => {
            try {
                const keys = await AsyncStorage.getAllKeys();
                const profileImageKeys = keys.filter(key => key.endsWith('_profileImage'));

                const imageUrls = await Promise.all(profileImageKeys.map(async key => {
                    const username = key.split('_')[0];
                    const imageUri = await AsyncStorage.getItem(key);
                    return { username, imageUri };
                }));

                const profileImagesObject = imageUrls.reduce((acc, { username, imageUri }) => {
                    acc[username] = imageUri || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541';
                    return acc;
                }, {} as { [key: string]: string });

                setProfileImages(profileImagesObject);
            } catch (error) {
                console.error('Failed to load profile images:', error);
            }
        };

        const checkLoginStatus = async () => {
            const loggedIn = await AsyncStorage.getItem('loggedIn');
            setIsLoggedIn(loggedIn === 'true');

            if (loggedIn === 'true') {
                const username = await AsyncStorage.getItem('loggedInUser');
                setLoggedInUser(username);
            }
        };

        loadPosts();
        loadProfileImages();
        checkLoginStatus();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const loadPosts = async () => {
                try {
                    const storedPosts = await AsyncStorage.getItem('posts');
                    if (storedPosts) {
                        setPosts(JSON.parse(storedPosts));
                    } else {
                        console.log('No posts found in AsyncStorage');
                    }
                } catch (error) {
                    console.error('Failed to load posts:', error);
                }
            };

            loadPosts();
        }, [])
    );

    const toggleLike = (postId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? {
                        ...post,
                        likes: likedPosts[postId] ? post.likes - 1 : post.likes + 1
                    }
                    : post
            )
        );
        setLikedPosts(prevState => ({
            ...prevState,
            [postId]: !likedPosts[postId],
        }));
    };

    const handleLoginLogout = async () => {
        if (isLoggedIn) {
            await AsyncStorage.removeItem('loggedIn');
            await AsyncStorage.removeItem('loggedInUser');
            setIsLoggedIn(false);
            setLoggedInUser(null);
            router.replace('/login');
        } else {
            router.replace('/login');
        }
    };

    const renderPost: ListRenderItem<Post> = ({ item }) => (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                <Image
                    source={{ uri: profileImages[item.userName] || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541' }}
                    style={styles.profileImage}
                />
                <Text style={styles.userName}>{item.userName}</Text>
            </View>

            {item.imageUrl && (
                <>
                    <Image source={item.imageUrl} style={styles.postImage} />
                    <Text style={styles.postContent}>{item.postContent}</Text>
                    <Text style={styles.sourceText}>Source: {item.source}</Text>
                </>
            )}
            <View style={styles.interactionContainer}>
                <TouchableOpacity
                    style={[
                        styles.interactionButton,
                        likedPosts[item.id] ? styles.likedButton : null
                    ]}
                    onPress={() => toggleLike(item.id)}
                >
                    <Icon name="heart" size={18} color={likedPosts[item.id] ? "#FFFFFF" : "#4CAF50"} />
                    <Text style={[styles.buttonText, { color: likedPosts[item.id] ? "#FFFFFF" : "#4CAF50" }]}>
                        {item.likes}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="message-square" size={18} color="#4CAF50" />
                    <Text style={styles.buttonText}>{item.comments}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <View style={styles.header}>
                <Text style={styles.logo}>Agri Vision</Text>
                <TouchableOpacity
                    style={[
                        styles.logButton,
                        loginButtonPressed ? styles.loginButtonPressed : null
                    ]}
                    onPress={handleLoginLogout}
                    onPressIn={() => setLoginButtonPressed(true)}
                    onPressOut={() => setLoginButtonPressed(false)}
                >
                    <User color="#FFFFFF" size={16} />
                    <Text style={styles.loginText}>{isLoggedIn ? "logout" : "login"}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.postCreationContainer}>
                <FlatList
                    data={[...posts, ...dummyPosts]} 
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.flatListContent}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#e8f5e9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 20,
        paddingTop: 60,
    },
    logo: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        borderRadius: 20,
    },
    loginButtonPressed: {},
    loginText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 5,
    },
    postCard: {
        backgroundColor: '#ffffff',
        marginBottom: 10,
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    postContent: {
        fontSize: 14,
        marginBottom: 10,
    },
    sourceText: {
        fontSize: 12,
        color: '#757575',
    },
    interactionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likedButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        paddingHorizontal: 10,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    flatListContent: {
        paddingHorizontal: 10,
    },
    postCreationContainer: {
        flex: 1,
    },
});

export default IndexPage;
